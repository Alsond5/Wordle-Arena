import { View, Text, Image, StyleSheet, Alert } from "react-native";
import { Button, Input, Loading } from "@/components";

import Constants from "expo-constants";

import { useSelector, useDispatch } from "react-redux";
import { login, register, setError, setUsername } from "@/redux/user-slice";
import { useEffect, useState } from "react";

const Login = () => {
    const { username, loading, error } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const [password, setPassword] = useState("");

    return (
        <View style={styles.container}>
            <View style={styles.topHeader}>
                <Text style={styles.largeText}>Hoşgeldin!</Text>
                <Text style={[{ marginTop: 5 }, styles.textStyle]}>Arenaya katılmak için hemen giriş yap!</Text>
            </View>
            <View style={styles.inputsContainer}>
                <Input
                    label={"Kullanıcı adı"}
                    placeholder={"Kullanıcı adınızı girin"}
                    onChange={(value) => {
                        dispatch(setUsername(value));
                    }}
                />
                <Input
                    label={"Şifre"}
                    placeholder={"Şifrenizi girin"}
                    secureTextEntry={true}
                    onChange={(value) => {
                        setPassword(value);
                    }}
                />
                <View style={{ marginTop: "auto", gap: 10, paddingVertical: 30 }}>
                    <Button
                        text="Giriş yap"
                        onPress={() => {
                            dispatch(login({ username, password }));
                        }}
                    />
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ flex: 1, height: 2, backgroundColor: "#d8dcf0", marginTop: 2 }}></View>
                        <Text style={{ fontWeight: "bold", color: "#d8dcf0", marginHorizontal: 10 }}>veya</Text>
                        <View style={{ flex: 1, height: 2, backgroundColor: "#d8dcf0", marginTop: 2 }}></View>
                    </View>
                    <Button
                        text="Kayıt ol"
                        variant="outline"
                        onPress={() => {
                            dispatch(register({ username, password }));
                        }}
                    />
                </View>
            </View>
            { loading && <Loading message={"Giriş yapılıyor"} /> }
            { error && Alert.alert("Hata", error, [
                { text: "Tamam", onPress: () => dispatch(setError(null)) }
            ])}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Constants.statusBarHeight,
        alignItems: "center",
        backgroundColor: "#FFFFFF"
    },
    topHeader: {
        width: "100%",
        paddingHorizontal: 30,
        marginTop: "15%"
    },
    largeText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#011627"
    },
    textStyle: {
        fontSize: 15,
        color: "#5D737E"
    },
    inputsContainer: {
        width: "100%",
        flex: 1,
        marginTop: 58,
        paddingHorizontal: 30,
        gap: 20
    }
})

export default Login;