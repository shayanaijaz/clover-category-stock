"use client"
import { useState, useEffect} from 'react'
import { useCookies } from 'next-client-cookies'
import { CategoryStock } from "@/types/category";
import { Loader2 } from 'lucide-react'
import CardComponent from './card';

export default function DashboardComponent() {

    const cookies = useCookies();
    const merchantId = cookies.get('merchant_id');
    const accessToken = cookies.get('access_token');

    const [categoryStocks, setCategoryStocks] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [])

    function fetchData() {
        fetch(`/api/stock?merchant_id=${merchantId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(res => res.json())
        .then((data: CategoryStock[]) => {
            setCategoryStocks(data);
            setLoading(false);
            console.log("CATEGORY STOCKS", categoryStocks)
        })
    }

    // useEffect(() => {
    //     setCategoryStocks([
    //         {
    //             id: 'X5VK5NFNT6HGT',
    //             name: 'Meat - Chicken',
    //             quantity: 19.6,
    //             numOrders: 1
    //             },
    //             {
    //             id: 'K9A37NR4Y044W',
    //             name: 'Meat - Beef',
    //             quantity: 15.79,
    //             numOrders: 0
    //             }
    //     ])
    // }, [])

    function handleAdd(stock: CategoryStock, quantityAdded: number) {
        fetch(`/api/stock`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                merchant_id: merchantId,
                category_id: stock.id,
                stock_added: quantityAdded
            })
        })
        .then(res => {
            fetchData();
        })
    }

    function handleEdit(stock: CategoryStock, quantityEdited: number) {
        fetch(`/api/stock`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                merchant_id: merchantId,
                category_id: stock.id,
                stock_edited: quantityEdited
            })
        })
        .then(res => {
            fetchData();
        })
    }

      return (
        <>
            <div className="h-1/6 p-8">
              <h1 className="text-3xl font-bold">Clover Category Stock</h1>
            </div>
            <div className="h-1/6 p-4 flex items-center justify-center">
              <h1 className="text-3xl font-bold">Current Stock</h1>
            </div>
            
            {loading && 
                <div className='h-fit flex items-center justify-center'>
                    <Loader2 className='h-16 w-16 animate-spin' />
                </div>
            }
            {categoryStocks.length > 0 && 
                <div className="p-16 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {categoryStocks.map(stock => (
                    <CardComponent 
                        key={stock.id}
                        stock={stock} 
                        onEdit={(quantityEdited) => handleEdit(stock, quantityEdited)}
                        onAdd={(quantityAdded) => handleAdd(stock, quantityAdded)}
                    />
                ))}
                </div>
            }
        </>
      ) 
}