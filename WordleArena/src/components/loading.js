import { useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Constants from "expo-constants";

const Loading = ({
    message
}) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#32EA82" />
            <Text style={styles.text}>{message}</Text>
        </View>
    )
}

export default Loading;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundColor: "#1e1d2e",
        justifyContent: "center",
        alignItems: "center",
        top: Constants.statusBarHeight
    },
    text: {
        fontSize: 17,
        fontWeight: "bold",
        color: "white",
        marginTop: 25
    }
})