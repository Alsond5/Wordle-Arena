import { Pressable, Text, View, StyleSheet } from "react-native";

const variants = {
    default: {
        backgroundColor: "#1e1d2e",
        borderColor: "transparent",
        color: "white"
    },
    outline: {
        backgroundColor: "white",
        borderColor: "#1e1d2e",
        color: "#1e1d2e"
    }
}

const Button = ({
    onPress,
    text,
    style,
    variant="default",
    backgroundColor
}) => {
    const variantStyle = variants[variant];
    variantStyle.backgroundColor = backgroundColor || variantStyle.backgroundColor;

    const buttonStyle = [styles.button, variantStyle]

    return (
        <View style={style}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    {
                        opacity: pressed ? 0.5 : 1
                    },
                    buttonStyle
                ]}
            >
                <Text style={[{ color: variantStyle.color }, styles.buttonText]}>{text}</Text>
            </Pressable>
        </View>
    )
}

export default Button;

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#1e1d2e",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center"
    },
    buttonText: {
        fontSize: 15,
        fontWeight: "bold"
    }
})