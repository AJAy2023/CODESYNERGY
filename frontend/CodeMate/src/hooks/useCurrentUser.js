import {useUser} from "@clerk/react";



export default function useCurrentUser()
{

    const  {user,  isLoaded , isSignedIn} = useUser();

    return {
        user,
        userId :user?.id,
        isLoaded,
        isSignedIn
    }
}



