import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/utils/databaseHelper';
import { decryptToken } from '@/utils/encryptionHelper';


const baseUrl: string = 'https://sandbox.dev.clover.com/v3/merchants';

export async function GET(request: NextRequest) {

    const { searchParams } = new URL(request.url);

    const merchantId = searchParams.get('merchant_id');
    const authorizationCode = searchParams.get('code')
    const authorizationHeaderToken = request.headers.get('authorization').split(' ')[1]
    const accessToken = decryptToken(authorizationHeaderToken)


    try {
        const response = await fetch(`${baseUrl}/${merchantId}/categories`,
        {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
        });

        const categories = (await response.json()).elements;      
        return NextResponse.json(categories, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }  
}