import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const Input = ({
    onChange,
    label,
    placeholder,
    style,
    secureTextEntry
}) => {
    const [value, setValue] = useState("");

    return (
        <View style={style}>
            <Text style={styles.labelStyle}>{label}</Text>
            <TextInput
                onFocus={(e) => {
                    e.currentTarget.setNativeProps({
                        style: { borderColor: "#32EA82" }
                    })
                }}
                onBlur={(e) => {
                    if (value !== "") return;
                    
                    e.currentTarget.setNativeProps({
                        style: { borderColor: "#C2ECD5" }
                    })
                }}
                onChangeText={(value) => {
                    setValue(value);
                    onChange(value);
                }}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#C3CCC7"
                secureTextEntry={secureTextEntry}
            />
        </View>
    )
}

export default Input;

const styles = StyleSheet.create({
    container: {
        width: "100%"
    },
    labelStyle: {
        color: "#A7AEAB",
        fontWeight: "bold"
    },
    input: {
        width: "100%",
        height: 50,
        borderWidth: 2,
        borderColor: "#C2ECD5",
        fontWeight: "500",
        paddingHorizontal: 15,
        marginTop: 10,
        backgroundColor: "#f5f7fc",
        color: "#1e1d2e",
        borderRadius: 10
    }
})