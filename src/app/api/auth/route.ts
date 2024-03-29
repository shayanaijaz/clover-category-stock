import fetch from 'node-fetch';
import { NextResponse } from 'next/server';
import { pool } from '@/app/api/_databaseHelper';
import { QueryResult } from 'pg';
import { encryptToken } from '@/app/api/_encryptionHelper';

const tokenUrl: string = `${process.env.CLOVER_URL}/oauth/token`

const clientID = process.env.CLOVER_CLIENT_ID;
const clientSecret = process.env.CLOVER_CLIENT_SECRET;

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);

  const merchantId = searchParams.get('merchant_id');
  const authorizationCode = searchParams.get('code')

  try {
    const tokenResponse = await fetch(
      `${tokenUrl}?client_id=${clientID}&client_secret=${clientSecret}&code=${authorizationCode}`
    );

    if (tokenResponse.ok) {
      const tokenData: any = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const encryptedToken = encryptToken(accessToken)

      try {
        await storeMerchantData(merchantId, encryptedToken, authorizationCode)
      } catch(error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      
      return NextResponse.json({'access_token': encryptedToken}, { status: 200 })
    } else {
      return NextResponse.json(tokenResponse.statusText, { status: tokenResponse.status });
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
} 

async function storeMerchantData(merchantId: string, accessToken: string, authorizationCode: string) : Promise<QueryResult> {
  const client = await pool.connect();

  try {
    const query: string = `
    INSERT INTO auth.merchant (merchant_id, access_token, authorization_code, created_at, last_updated)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (merchant_id)
    DO UPDATE SET 
      access_token = EXCLUDED.access_token, 
      authorization_code = EXCLUDED.authorization_code, 
      last_updated = NOW()
    `

    const values: string[] = [merchantId, accessToken, authorizationCode];

    return client.query(query, values);

  } finally {
    client.release();
  }
}