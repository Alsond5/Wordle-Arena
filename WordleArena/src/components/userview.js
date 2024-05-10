import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from "react-native";

const UserView = ({
    onPress,
    userDetails,
    opacity
}) => {
    return (
        <View 
            style={styles.container}
        >
            <Animated.View style={{ opacity }}>
                <View style={[{
                    backgroundColor: (userDetails.status === 1) ? "#32EA82" : "#FB6107",
                }, styles.status]}></View>
            </Animated.View>
            <View style={{ marginLeft: 28 }}>
                <Text style={{ fontWeight: "bold" }}>{userDetails.username}</Text>
            </View>
            <View style={{ marginLeft: "auto" }}>
                <TouchableOpacity
                    onPress={onPress}
                    disabled={userDetails.status !== 1}
                    style={[{
                        opacity: (userDetails.status === 1) ? 1 : 0.5
                    }, styles.button]}
                >
                    <Image
                        source={require('@assets/battle.png')}
                        style={{ width: 20, height: 20 }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default UserView;

const styles = StyleSheet.create({
    container: {
        height: 58,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#F0F0F0"
    },
    status: {
        width: 10,
        height: 10,
        borderRadius: 10,
        marginTop: 1
    },
    button: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "#D8DCF0",
        justifyContent: "center",
        alignItems: "center"
    }
});