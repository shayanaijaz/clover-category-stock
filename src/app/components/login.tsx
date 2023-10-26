"use client"

import { useState, useEffect} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCookies } from 'next-client-cookies'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function LoginComponent() {

    const searchParams = useSearchParams();
    const cookies = useCookies();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);

    const merchantId = searchParams.get('merchant_id');
    const code = searchParams.get('code');

    useEffect(() => {
        async function fetchData() {
            const res = await fetch(`/api/auth?merchant_id=${merchantId}&code=${code}`)
            const data = await res.json();

            cookies.set('access_token', data.access_token);
            cookies.set('merchant_id', merchantId)

            setIsLoading(false);

            await delay(1000);

            router.push('/dashboard');
        }

        if (merchantId && code) {
            fetchData();
        }
    }, []);

    return (
        <>
            <div className='h-screen flex items-center justify-center'>
                {isLoading ? (
                    <h1 className='text-3xl font-bold'>Authorizing...</h1>
                ) : <h1 className='text-3xl font-bold text-green-500'>Authorized! Now Redirecting...</h1> }
            </div>
        </>
    )
}