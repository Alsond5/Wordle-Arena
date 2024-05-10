import { Login } from "@/screens";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
        >

            <Stack.Screen name="Login" component={Login} />

        </Stack.Navigator>
    )
}

export default AuthStack;