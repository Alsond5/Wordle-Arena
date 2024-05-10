import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

import { useSelector } from 'react-redux';

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const Box = ({
    state,
    isCurrentRow=false,
    ms=0
}) => {
    const { room } = useSelector(state => state.channel);

    const colors = {
        "correct": "#6aaa64",
        "present": "#c9b458",
        "absent": "#787c7e"
    }
    
    const borderColor = (state.value === "") ? "#d3d6da" : "#878a8c";

    const [backgroundColor, setBackgroundColor] = useState("white");
    const [borderColorValue, setBorderColorValue] = useState(borderColor);

    const [viewSize, setViewSize] = useState({ width: 0, height: 0 });

    const onViewLayout = (event) => {
        const { width, height } = event.nativeEvent.layout;
        console.log(width, height);
        setViewSize({ width, height });
    };

    useEffect(() => {
        if (state.value === "") {
            setBorderColorValue("#d3d6da");
        } else {
            setBackgroundColor((!isCurrentRow) ? colors[state.status] : "white");
            setBorderColorValue((isCurrentRow) ? "#878a8c" : colors[state.status]);
        }
    }, [state.value])

    const rotateAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (state.status === "" || !isCurrentRow) {
            return;
        }
        
        rotateAnimation.addListener((v) => {
            if (v.value === 1) {
                setBackgroundColor(colors[state.status]);
                setBorderColorValue(colors[state.status]);
            }
        })

        sleep(ms).then(() => {
            Animated.sequence([
                Animated.timing(rotateAnimation, {
                    toValue: 1,
                    duration: 250,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(rotateAnimation, {
                    toValue: 0,
                    duration: 250,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true
                })
            ]).start();
        })

        return () => {
            rotateAnimation.removeAllListeners();
        }
    }, [state.status]);

    return (
        <Animated.View
            onLayout={onViewLayout}
            style={[{
                backgroundColor: backgroundColor,
                borderColor: borderColorValue,
                transform: [{
                    rotateX: rotateAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg']
                    })
                }],
                width: (room) ? `${(100 / room) - 3}%` : "17%",
            }, styles.container]}
        >
            <Text 
                style={[{
                    color: (backgroundColor !== "white") ? "white" : "#1E1D2E",
                    fontSize: (Number(viewSize.width / 2) > 20) ? 20 : Number(viewSize.width / 2)
                }, styles.textStyle]}
            >
                {state.value}
            </Text>
        </Animated.View>
    )
}

export default Box;

const styles = StyleSheet.create({
    container: {
        maxWidth: 52,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2
    },
    textStyle: {
        fontWeight: 'bold'
    }
});