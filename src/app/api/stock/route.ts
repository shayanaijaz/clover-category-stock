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

    const todayStartDate = new Date()
    todayStartDate.setHours(8);
    todayStartDate.setMinutes(30);
    const todayStartDateTimestamp = todayStartDate.getTime();

    const todayEndDate = new Date();
    todayEndDate.setHours(23);
    todayEndDate.setMinutes(59);
    const todayEndDateTimestamp = todayEndDate.getTime();

    try {
        const response = await fetch(`${baseUrl}/${merchantId}/orders?filter=createdTime>=${todayStartDateTimestamp}&filter=createdTime<=${todayEndDateTimestamp}&expand=lineItems`,
        {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
        });

        const orders: Order[] = (await response.json()).elements;
        const categoryStocks: CategoryStock[] = await processOrders(orders, merchantId, accessToken)

        for (const categoryStock of categoryStocks) {
            const currentStockQuantity: number = Number((await getStockData(merchantId, categoryStock.id)));

            if (categoryStock.quantity !== currentStockQuantity) {
                await storeStockData(merchantId, categoryStock)
            }
        }
        
        return NextResponse.json(categoryStocks, { status: 200 })
    } catch (error) {
        return NextResponse.json(error, { status: 500 });
    }  
}

async function processOrders(orders: Order[], merchantId: string, accessToken: string) {

    const categoriesWithStock: CategoryStock[] = []

    for (const order of orders) {
        for (const lineItem of order.lineItems.elements) {
            const quantity: number = Number((lineItem.unitQty / 1000).toFixed(2))

            try {
                const categories: Category[] = await getItemCategory(lineItem.item.id, merchantId, accessToken);

                for (const category of categories) {
                    const existingCategory = categoriesWithStock.find(x => x.id === category.id);

                    if (existingCategory) {
                        existingCategory.quantity = Number((existingCategory.quantity + quantity).toFixed(2));
                        existingCategory.numOrders += 1;
                    } else {
                        categoriesWithStock.push({id: category.id, name: category.name, quantity, numOrders: 1})
                    }
                }
            } catch (error) {
                // Handle or log errors when fetching categories
                console.error(`Error processing line item: ${error}`);
            }
        }
    }
      
    return categoriesWithStock;
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
    } finally {
        client.release();
    }

}

async function storeStockData(merchantId: string, categoryStock: CategoryStock) {

    const client = await pool.connect();

    try {
        const query: string = `
                INSERT INTO stock_data.stock (category_id, merchant_id, stock_quantity, last_updated)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (category_id)
                DO UPDATE SET 
                stock_quantity = EXCLUDED.stock_quantity, 
                last_updated = NOW()
                `
        const values: (string | number)[] = [categoryStock.id, merchantId, categoryStock.quantity];

        await client.query(query, values);
    } catch (error) {
        console.error(error)
    } finally {
        client.release();
    }
}