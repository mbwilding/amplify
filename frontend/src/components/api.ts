import { apiUrl } from '../config'

type Mode = 'GET' | 'POST';

async function fetchApi(mode: Mode, call: string = '', body: any = null) {
    const options: RequestInit = { method: mode };

    if (mode === 'POST' && body) {
        options.body = JSON.stringify(body);
        options.headers = {
            'Content-Type': 'application/json',
        };
    }

    const response = await fetch(apiUrl + call, options);

    const data = await response.json();
    console.log(data);

    return response;
}

export async function fetchApiCount(count: number) {
    return await fetchApi('GET', `count?count=${count}`);
}
