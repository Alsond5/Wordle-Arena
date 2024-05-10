import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Rooms, WordConfirmation, Game, Results } from "@/screens";

import { AppState } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { connect } from "@/redux/socket-slice";

const Stack = createNativeStackNavigator();

const UserStack = () => {
  const { user } = useSelector((state) => state.user);

  const dispatch = useDispatch();

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          user.token && dispatch(connect({ token: user.token }));
        }

        appState.current = nextAppState;
        setAppStateVisible(appState.current);
        console.log('AppState', appState.current);
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack.Navigator
      initialRouteName="Rooms"
      screenOptions={{ headerShown: false }}>

      <Stack.Screen
        name="Rooms"
        component={Rooms}
      />

      <Stack.Screen
        name="WordConfirmation"
        component={WordConfirmation}
      />

      <Stack.Screen
        name="Game"
        component={Game}
      />

      <Stack.Screen
        name="Results"
        component={Results}
      />

    </Stack.Navigator>
  );
}

export default UserStack;