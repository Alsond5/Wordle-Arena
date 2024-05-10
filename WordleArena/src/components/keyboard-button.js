import { Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const KeyboardButton = ({ value, onPress }) => {
    return (
        <TouchableOpacity
            onPress={() => {
                onPress(value);
            }}
            style={[{
                flex: (value === "ENTER" || value === "DELETE") ? 2 : 1
            }, styles.button]}
        >
            { value === "DELETE" ? <Image
                source={require('../../assets/backspace.png')}
                style={styles.iconStyle}
            /> : <Text style={styles.textStyle}>
                {value}
            </Text> }
        </TouchableOpacity>
    )
}

export default KeyboardButton;

const styles = StyleSheet.create({
    button: {
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        backgroundColor: "#D3D6DA"
    },
    iconStyle: {
        width: 20,
        height: 20,
        marginRight: 3
    },
    textStyle: {
        fontSize: 13,
        color: "#1a1a1b",
        fontWeight: "bold"
    }
});