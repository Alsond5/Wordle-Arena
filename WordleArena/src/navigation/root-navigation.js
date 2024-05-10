import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";

import UserStack from "./user-stack";
import AuthStack from "./auth-stack";

const RootNavigation = () => {
    const { authenticated } = useSelector((state) => state.user);

    return (
        <NavigationContainer>
            { authenticated ? <UserStack /> : <AuthStack /> }
        </NavigationContainer>
    )
}

export default RootNavigation;