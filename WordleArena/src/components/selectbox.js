import { Text, View, Image, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

const SelectBox = ({
    onPress,
    title,
    items,
    activeItem
}) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => setExpanded(!expanded)}
                style={styles.button}
            >
                <Text style={styles.textStyle}>{activeItem ? activeItem : title}</Text>
                <Image
                    source={require('@assets/arrow.png')}
                    style={{
                        width: 20,
                        height: 20,
                        marginLeft: "auto"
                    }}
                />
            </Pressable>
            { expanded && <View style={styles.options}>
                { items.map((item, index) => (
                    <Pressable
                        key={index}
                        onPress={() => {
                            onPress(item);
                            setExpanded(false);
                        }}
                        style={({ pressed }) => [{
                            backgroundColor: pressed ? "#f5f5f5" : "white"
                        }, styles.option]}
                    >
                        <Text style={styles.textStyle}>{item}</Text>
                    </Pressable>
                ))}
            </View> }
        </View>
    )
}

export default SelectBox;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        zIndex: 101
    },
    button: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 5,
        flexDirection: "row",
        alignItems: "center"
    },
    options: {
        width: "100%",
        position: "absolute",
        top: 58,
        shadowColor: "#585858",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity:  0.17,
        shadowRadius: 2.54,
        elevation: 3,
        borderRadius: 5,
        backgroundColor: "white"
    },
    textStyle: {
        fontSize: 13,
        color: "#1e1d2e",
        fontWeight: "bold"
    },
    option: {
        width: "100%",
        padding: 15,
        borderRadius: 5
    }
})