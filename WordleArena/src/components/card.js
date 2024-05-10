import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Constants from 'expo-constants';

import Button from "./button";

const Card = ({
    yes,
    no,
    message="Bir hata oluştu. Lütfen tekrar deneyin."
}) => {
    return (
        <View style={styles.container}>
            <View style={{
                width: "100%",
                height: "35%",
                backgroundColor: "white",
                position: "relative",
                alignItems: 'center',
                borderRadius: 10,
                padding: 25,
                backgroundColor: "#1E1D2E"
            }}>
                <View style={{
                    width: 20,
                    height: 3,
                    backgroundColor: "#D3D6DA",
                    borderRadius: 30
                }}></View>
                <Text style={{
                    fontSize: 20,
                    fontWeight: '500',
                    color: "#D3D6DA",
                    marginTop: 10,
                    letterSpacing: 1
                }}>Uyarı</Text>
                <View style={{
                    flex: 1,
                    width: "100%",
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 10
                }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: "#D3D6DA"
                    }}>
                        {message}
                    </Text>
                </View>
                <View style={{
                    width: "100%",
                    flexDirection: "row",
                    alignItems: 'center',
                    marginTop: 10,
                    gap: 20
                }}>
                    <TouchableOpacity
                        onPress={no}
                        style={{
                            flex: 1,
                            backgroundColor: "#F42C04",
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 10,
                            height: 50
                        }}
                    >
                        <Text style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: "white"
                        }}>Reddet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={yes}
                        style={{
                            flex: 1,
                            backgroundColor: "#23BA65",
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 10,
                            height: 50
                        }}
                    >
                        <Text style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: "white"
                        }}>Kabul et</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default Card;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: "100%",
        position: "absolute",
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        top: Constants.statusBarHeight
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        borderWidth: 2,
        width: "100%",
        height: 50
    },
    text: {
        fontSize: 13,
        fontWeight: 'bold'
    }
})