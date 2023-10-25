import { NextResponse } from 'next/server';
import { pool } from '@/utils/databaseHelper';
import { decryptToken } from '@/utils/encryptionHelper';
import { Order } from '@/types/order';
import { Category, CategoryStock } from '@/types/category';
import { QueryResult } from '@vercel/postgres';
import cli from '@angular/cli';


const baseUrl = 'https://sandbox.dev.clover.com/v3/merchants'

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id');
    const authorizationHeaderToken = request.headers.get('authorization').split(' ')[1]
    const accessToken = decryptToken(authorizationHeaderToken)

    // const todayStartDate = new Date()
    // todayStartDate.setHours(8);
    // todayStartDate.setMinutes(30);

    // get all the categories for this merchant

    try {

        // first process all the default data before processing any new data

        const categoriesResponse = await fetch(`${baseUrl}/${merchantId}/categories`,
        {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
        });

        const categories: Category[] = (await categoriesResponse.json()).elements;

        let categoryStocks: CategoryStock[] = [];

        for (const category of categories) {
            categoryStocks.push(
                {
                    id: category.id,
                    name: category.name,
                    quantity: Number(await getStockData(merchantId, category.id)),
                    numOrders: 0
                }
            )
        }

        // At this point we have a default category stock array which has every category the merchant has


        // get the start and end time here 

        const todayStartDateTimestamp = await getStartTimeForOrders(merchantId);

        const todayEndDate = new Date();
        todayEndDate.setHours(23);
        todayEndDate.setMinutes(59);
        const todayEndDateTimestamp = todayEndDate.getTime();

        // Now we can get the orders to see if any of the categories need to be updated 
        const response = await fetch(`${baseUrl}/${merchantId}/orders?filter=createdTime>${todayStartDateTimestamp}&filter=createdTime<=${todayEndDateTimestamp}&expand=lineItems`,
        {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
        });

        const orders: Order[] = (await response.json()).elements;

        categoryStocks = await processOrders(orders, categoryStocks, merchantId, accessToken);

        const lastOrderDate = orders.length !== 0 ? new Date(orders[orders.length - 1].createdTime) : new Date();

        // update the stock values in db
        for (const categoryStock of categoryStocks) {
            await storeStockData(merchantId, categoryStock, lastOrderDate)
        }
        
        return NextResponse.json(categoryStocks, { status: 200 })
    } catch (error) {
        return NextResponse.json("An error has occurred", { status: 500 });
    }  
}

export async function PUT(request: Request) {
    const authorizationHeaderToken = request.headers.get('authorization').split(' ')[1]
    const { merchant_id: merchantId, category_id: categoryId, stock_added: stockAdded } = await request.json();

    try {
        await authenticateUser(authorizationHeaderToken, merchantId)
    } catch (error) {
        return NextResponse.json('Unauthorized', { status: 401 })
    }

    const client = await pool.connect();

    try {
        const query = `
            UPDATE stock_data.stock
            SET stock_quantity = stock_quantity + $1
            WHERE merchant_id = $2 AND category_id = $3
        `

        const values: (string | number)[] = [Number(stockAdded), merchantId, categoryId];

        await client.query(query, values);

        return NextResponse.json('', { status: 200 })
    } catch (error) {
        console.error(error);
        return NextResponse.json('An error has occurred', { status: 500 })
    } finally {
        client.release();
    }

}

export async function POST(request: Request) {
    const authorizationHeaderToken = request.headers.get('authorization').split(' ')[1]
    const { merchant_id: merchantId, category_id: categoryId, stock_edited: stockEdited } = await request.json();

    try {
        await authenticateUser(authorizationHeaderToken, merchantId)
    } catch (error) {
        return NextResponse.json('Unauthorized', { status: 401 })
    }

    const client = await pool.connect();

    try {
        const query = `
            UPDATE stock_data.stock
            SET stock_quantity = $1
            WHERE merchant_id = $2 AND category_id = $3
        `

        const values: (string | number)[] = [Number(stockEdited), merchantId, categoryId];

        await client.query(query, values);

        return NextResponse.json('', { status: 200 })
    } catch (error) {
        console.error(error);
        return NextResponse.json('An error has occurred', { status: 500 })
    } finally {
        client.release();
    }
}

async function getStartTimeForOrders(merchantId: string) {
    const client = await pool.connect();

    try {
        const query: string = `
            SELECT last_order_date FROM stock_data.stock
            WHERE merchant_id = $1 LIMIT 1
        `

        const values: string[] = [merchantId];

        const result = await client.query(query, values)

        let lastOrderTimestamp: Number;
        const currentDate = new Date();

        if (result.rows[0].last_order_date && new Date(result.rows[0].last_order_date).getDate() == currentDate.getDate()) {
            lastOrderTimestamp = new Date(result.rows[0].last_order_date).getTime();
        } else {
            let tempDate = new Date()
            tempDate.setHours(8);
            tempDate.setMinutes(30);
            lastOrderTimestamp = tempDate.getTime();
        }
        
        return lastOrderTimestamp;

    } catch(error) {
        console.error(error);
    } finally {
        client.release();
    }
}

async function processOrders(orders: Order[], categoryStocks: CategoryStock[], merchantId: string, accessToken: string) {

    for (const order of orders) {
        for (const lineItem of order.lineItems.elements) {
            const quantity: number = Number((lineItem.unitQty / 1000).toFixed(2))

            try {
                const categories: Category[] = await getItemCategory(lineItem.item.id, merchantId, accessToken);

                for (const category of categories) {
                    const existingCategory = categoryStocks.find(x => x.id === category.id);

                    if (existingCategory && existingCategory.quantity !== quantity) {
                        existingCategory.quantity = Number((existingCategory.quantity - quantity).toFixed(2));
                        existingCategory.numOrders += 1;
                    } else {
                        categoryStocks.push({id: category.id, name: category.name, quantity, numOrders: 1})
                    }
                }
            } catch (error) {
                // Handle or log errors when fetching categories
                console.error(`Error processing line item: ${error}`);
                throw error;
            }
        }
    }
      
    return categoryStocks;
}

async function getItemCategory(itemId: string, merchantId: string, accessToken: string) {
    try {
        const response = await fetch(`${baseUrl}/${merchantId}/items/${itemId}/categories`,
        {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
        });

        const categories: Category[] = (await response.json()).elements
        
        return categories;

    } catch (error) {
        return [];
    } 
}

async function getStockData(merchantId: string, categoryId: string) {
    const client = await pool.connect();

    try {
        const query: string = `
            SELECT stock_quantity FROM stock_data.stock
            WHERE category_id = $1 LIMIT 1
        `

        const values: string[] = [categoryId];

        const result = await client.query(query, values)
        
        if (result.rows.length == 0) {
            await insertNewCategoryStock(merchantId, categoryId);
            return 0;
        } else {
            return result.rows[0].stock_quantity;
        }

    } catch(error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function insertNewCategoryStock(merchantId: string, categoryId: string) {

    // something goes wrong when entering a new stock
    const client = await pool.connect();

    try {
        const query: string = `
            INSERT INTO stock_data.stock 
            VALUES ($1, $2, $3, NOW())
        `

        const values: (string | number)[] = [categoryId, merchantId, 0]

        await client.query(query, values)
    } catch (error) {
        console.error(error)
        throw error;
    } finally {
        client.release();
    }

}

async function storeStockData(merchantId: string, categoryStock: CategoryStock, lastOrderDate: Date) {

    const client = await pool.connect();

    try {
        const query: string = `
                INSERT INTO stock_data.stock (category_id, merchant_id, stock_quantity, last_updated, last_order_date)
                VALUES ($1, $2, $3, NOW(), $4)
                ON CONFLICT (category_id)
                DO UPDATE SET 
                stock_quantity = EXCLUDED.stock_quantity, 
                last_updated = NOW(),
                last_order_date = EXCLUDED.last_order_date
                `
        const values: (string | number | Date)[] = [categoryStock.id, merchantId, categoryStock.quantity, lastOrderDate];

        await client.query(query, values);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function authenticateUser(accessToken: string, merchantId: string) {
    const client = await pool.connect();

    try {
        const query: string = `
                    SELECT merchant_id FROM auth.merchant
                    WHERE merchant_id = $1
                    AND access_token = $2
                `
        const values: (string)[] = [merchantId, accessToken];

        const result = await client.query(query, values);

        if (result.rows.length !== 1) {
            throw new Error('Not Authorized')
        }

    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}