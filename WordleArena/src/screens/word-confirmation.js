import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native';

import { useSelector, useDispatch } from 'react-redux';

import { Loading, Box, KeyboardButton } from '@/components';
import { sendMessage } from '@/redux/socket-slice';
import { setRow, setCol, setWaiting, setGameStatus } from '@/redux/game-slice';

const keyboard = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "DELETE"]
]

const WordConfirmation = ({ navigation }) => {
    const { gameStatus, gameId, waiting, initialLetter } = useSelector((state) => state.game);
    const { room } = useSelector((state) => state.channel);

    const dispatch = useDispatch();

    const [progress, setProgress] = useState(60);
    const [intervalId, setIntervalId] = useState(null);

    const [localCol, setLocalCol] = useState(0);

    const [rowValues, setRowValues] = useState(Array.from({ length: room }, (_, index) => {
        return {
            value: "",
            status: ""
        };
    }));

    useEffect(() => {
        setLocalCol(0);
    }, [])

    const keyboardPress = (key) => {
        if (key === "ENTER") {
            dispatch(sendMessage({
                op: 7,
                d: {
                    game_id: gameId,
                    word: rowValues.map((value) => value.value).join("")
                }
            }));
            
            dispatch(setWaiting(true));
        }

        else if (key === "DELETE") {
            if (localCol > 0) {
                rowValues[localCol - 1].value = "";
                setLocalCol(localCol - 1);
            }
        }

        else {
            if (localCol < room) {
                rowValues[localCol].value = key;

                setLocalCol(localCol + 1);
            }
        }
    }

    useEffect(() => {
        if (initialLetter) {
            setRowValues(
                rowValues.map((value, index) => {
                    if (index === initialLetter.index) {
                        return {
                            value: initialLetter.letter,
                            status: ""
                        }
                    }
                    
                    return {
                        value: "",
                        status: ""
                    };
                })
            );
        }
    }, [initialLetter]);

    useEffect(() => {
        if (gameStatus === "reject") {
            dispatch(setWaiting(false));
            navigation.navigate("Rooms");
        }

        else if (gameStatus === "accept") {
            if (intervalId !== null) {
                clearInterval(intervalId);
            }

            setProgress(60);

            startCountdown();
        }

        else if (gameStatus === "try_again") {
            dispatch(setGameStatus("accept"));
        }

        else if (gameStatus === "confirm") {
            stopCountdown();
        }

        else if (gameStatus === "start") {
            stopCountdown();
            
            dispatch(setRow(0));
            dispatch(setCol(0));

            navigation.navigate("Game");
        }

        else if (gameStatus === "lose") {
            if (!navigation.isFocused()) {
                return;
            }

            Alert.alert("Oyun Bitti", "Kaybettiniz", [{
                text: "Tamam",
                onPress: () => navigation.navigate("Rooms")
            }]);
        }

        else if (gameStatus === "win") {
            if (!navigation.isFocused()) {
                return;
            }

            Alert.alert("Oyun Bitti", "Kazandınız", [{
                text: "Tamam",
                onPress: () => navigation.navigate("Rooms")
            }]);
        }

        return () => {  }
    }, [gameStatus]);

    const startCountdown = () => {
        const id = setInterval(() => {
            setProgress((prev) => {
                if (prev === 0) {
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        setIntervalId(id);
    }

    const stopCountdown = () => {
        if (intervalId && (gameStatus === "confirm" || gameStatus === "start" || progress === 0)) {
            clearInterval(intervalId);
        }
    }
    
    useEffect(() => {
        if (progress === 0) {
            clearInterval(intervalId);

            dispatch(sendMessage({
                op: 11,
                d: {}
            }));

            setProgress(60);
        }
    }, [progress, intervalId])

    return (
        <View style={styles.containerStyle}>
            <View style={styles.progressbar}>
                <Text style={{ fontSize: 20, color: "#F03A47" }}>{progress}</Text>
            </View>
            <View style={styles.column}>
                <View style={styles.row}>
                        { rowValues.map((colValues, rowIndex) => (
                            <Box
                                key={rowIndex}
                                state={{ value: colValues.value, status: colValues.status }}
                                isCurrentRow={true}
                            />
                        )) }
                    </View>
                
            </View>
            
            <View style={styles.keyboardContainer}>
               { keyboard.map((keyRow, rowIndex) => (
                    <View key={`row_${rowIndex}`}
                        style={[{
                            paddingHorizontal: (rowIndex === 1) ? 23 : 8,
                        }, styles.keyboardRow]}
                    >
                        { keyRow.map((key, colIndex) => (
                            <KeyboardButton
                                key={`row_${rowIndex}_key_${colIndex}`}
                                value={key}
                                onPress={keyboardPress}
                            />
                        ))}
                    </View>
               )) }
            </View>
            
            { waiting && (
                <Loading
                    message={"Oyuncu bekleniyor..."}
                />
            )}
        </View>
    );
}

export default WordConfirmation;

const styles = StyleSheet.create({
    containerStyle: {
        flex: 1,
        backgroundColor: 'white'
    },
    column: {
        marginTop: 125,
        width: "100%",
        alignItems: "center"
    },
    row: {
        flexDirection: "row",
        gap: 5
    },
    keyboardContainer: {
        width: "100%",
        marginTop: "auto",
        paddingVertical: 50,
        gap: 8
    },
    keyboardRow: {
        flexDirection: "row",
        justifyContent: 'center',
        gap: 5
    },
    progressbar: {
        position: "absolute",
        right: 30,
        top: 50,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center"
    },
    progress: {
        height: "100%",
        backgroundColor: "#F03A47"
    }
});