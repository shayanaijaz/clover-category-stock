import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card"
import { CategoryStock } from "@/types/category";
import { decryptToken } from "@/utils/encryptionHelper";
import { access } from "fs";
import { getCookies } from 'next-client-cookies/server';
import { Button } from "@/components/ui/button"
import { PlusSquare, Edit } from 'lucide-react'

const baseUrl = 'http://localhost:3000'

// `app/dashboard/page.tsx` is the UI for the `/dashboard` URL
export default async function Page() {

  const cookies = getCookies();
  const merchantId = cookies.get('merchant_id');
  const accessToken = cookies.get('access_token');

  // const res = await fetch(`${baseUrl}/api/stock?merchant_id=${merchantId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${accessToken}`
  //   }
  // })

  // const categoryStocks: CategoryStock[] = await res.json();


  const categoryStocks: CategoryStock [] = [
    {
      id: 'X5VK5NFNT6HGT',
      name: 'Meat - Chicken',
      quantity: 19.6,
      numOrders: 1
    },
    {
      id: 'K9A37NR4Y044W',
      name: 'Meat - Beef',
      quantity: 15.79,
      numOrders: 0
    }
  ]

  return (
    <>
        <div className="h-1/6 p-8">
          <h1 className="text-3xl font-bold">Clover Category Stock</h1>
        </div>
        <div className="h-1/6 p-4 flex items-center justify-center">
          <h1 className="text-3xl font-bold">Current Stock</h1>
        </div>
        <div className="p-16 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categoryStocks.map(stock => (
            <Card key={stock.id}>
              <CardHeader>
                <CardTitle>{stock.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-center font-bold text-2xl">
                <p>{stock.quantity}lbs</p>
              </CardContent>
              <CardFooter className="py-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                <Button className="bg-green-600">
                  <PlusSquare className="mr-2 h-4 w-4"/> Add Stock
                </Button>
                <Button className="bg-yellow-600">
                  <Edit className="mr-2 h-4 w-4"/> Edit Stock
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
    
    </>
  ) 
    
  }