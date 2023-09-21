import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export interface CountryIs {
    countryCode: string;
}

const getMyCountryCode = async () => {
    try {
        const response = await fetch('http://ip-api.com/json');
        const json: CountryIs = await response.json();
        return json.countryCode;
    } catch (e) {
        return null;
    }
};

export const useCountrySetting = () => {
    const sdk = useAppSdk();
    return useQuery<string | null, Error>([QueryKey.country, 'store'], async () => {
        return await sdk.storage.get<string>(AppKey.COUNTRY);
    });
};

export const useAutoCountry = () => {
    return useQuery<string | null, Error>([QueryKey.country, 'detect'], async () => {
        return await getMyCountryCode();
    });
};

export const useUserCountry = () => {
    const sdk = useAppSdk();
    return useQuery<string | null, Error>([QueryKey.country], async () => {
        let code = await sdk.storage.get<string>(AppKey.COUNTRY);
        if (!code) {
            code = await getMyCountryCode();
        }
        return code;
    });
};

export const useMutateUserCountry = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, string | undefined>(async value => {
        if (value) {
            await sdk.storage.set(AppKey.COUNTRY, value);
        } else {
            await sdk.storage.delete(AppKey.COUNTRY);
        }
        await client.invalidateQueries([QueryKey.country]);
    });
};
