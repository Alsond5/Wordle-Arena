import { Animated, Easing } from "react-native";
import Box from "./box";
import { useEffect, useRef } from "react";

import { setError } from "@/redux/game-slice";
import { useDispatch, useSelector } from "react-redux";

const Row = ({
    rowIndex,
    row,
    colValues
}) => {
    const errorAnimation = useRef(new Animated.Value(1)).current;

    const { error, words } = useSelector((state) => state.game);
    const dispatch = useDispatch();

    useEffect(() => {
        if (error && row === rowIndex) {
            Animated.sequence([
                Animated.timing(errorAnimation, {
                    toValue: 0,
                    duration: 25,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(errorAnimation, {
                    toValue: 2,
                    duration: 50,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(errorAnimation, {
                    toValue: 0,
                    duration: 50,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(errorAnimation, {
                    toValue: 2,
                    duration: 50,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(errorAnimation, {
                    toValue: 1,
                    duration: 50,
                    easing: Easing.linear,
                    useNativeDriver: true
                })
            ]).start(() => {
                dispatch(setError(null));
            });
        }
    }, [error]);

    return (
        <Animated.View key={`view_${rowIndex}`} style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 5,
            width: "100%",
            transform: [
                {
                    translateX: errorAnimation.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [-5, 0, 5]
                    })
                }
            ]
        }}>
            { colValues.map((values, colIndex) => (
                <Box
                    key={5 * rowIndex + colIndex}
                    state={{ value: values.value || "", status: values.status || "" }}
                    isCurrentRow={row === rowIndex}
                    ms={350 * colIndex}
                />
            )) }
        </Animated.View>
    )
}

export default Row;