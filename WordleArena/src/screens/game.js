import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { Row, KeyboardButton, Loading } from '@/components';
import { sendMessage } from '@/redux/socket-slice';
import { setRow, setCol, setWordCheckResults, updateRowWords, updateWords, setTimestamp } from '@/redux/game-slice';

const keyboard = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "DELETE"]
]

const copyArray = (array) => {
    return [...array.map((rows) => [...rows])];
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const Game = ({ navigation }) => {
    const { gameStatus, wordCheckResults, words, row, col, timestamp } = useSelector((state) => state.game);
    const { room } = useSelector((state) => state.channel);

    const [progress, setProgress] = useState(10);
    const [intervalId, setIntervalId] = useState(null);

    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            if (gameStatus === "win" || gameStatus === "lose") {
                if (!navigation.isFocused()) {
                    return;
                }

                stopCountdown();

                await sleep(300 * room);
    
                navigation.navigate("Results");
            }

            else if (gameStatus === "other_player_finished") {
                if (!navigation.isFocused()) {
                    return;
                }

                stopCountdown();
                await sleep(100);
                
                startCountdown(10);
            }
        })();
    }, [gameStatus]);

    const startCountdown = (s) => {
        if (!timestamp) {
            dispatch(setTimestamp(Date.now()));
        }

        setProgress(s);

        const id = setInterval(() => {
            setProgress((prev) => {
                if (prev === 0) {
                    return 0;
                }

                console.log("prev", prev)

                return prev - 1;
            });
        }, 1000);

        setIntervalId(id);
        
        return id;
    }

    const stopCountdown = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }

        setProgress(70);
        dispatch(setTimestamp(null));
    }

    useEffect(() => {
        console.log(timestamp);
    }, [timestamp])

    useEffect(() => {
        if (row >= room || !navigation.isFocused()) return;

        const s = (gameStatus !== "other_player_finished") ? 70 : 10;

        if (timestamp) {
            const diff = Math.floor((Date.now() - timestamp) / 1000);
            const s = 70 - diff;

            if (s <= 0) {
                dispatch(sendMessage({
                    op: 12,
                    d: {}
                }));
            }
        }

        const id = startCountdown(s);

        return () => {
            clearInterval(id);
        }
    }, [row]);

    useEffect(() => {
        if (progress === 0) {
            stopCountdown();
            
            if (gameStatus !== "other_player_finished") {
                dispatch(sendMessage({
                    op: 12,
                    d: {}
                }));
            }
        }
    }, [progress, intervalId]);

    useEffect(() => {
        (async () => {
            if (wordCheckResults && wordCheckResults.length > 0) {
                dispatch(updateRowWords({
                    value: wordCheckResults,
                    row: row
                }));

                await sleep(500 * room);

                dispatch(setRow(row + 1));
                dispatch(setCol(0));

                dispatch(setWordCheckResults([]));
            }
        })();
    }, [wordCheckResults]);

    const keyboardPress = (key) => {
        if (key === "ENTER") {
            dispatch(sendMessage({
                op: 10,
                d: {
                    word: words[row].map((value) => value.value).join("")
                }
            }));
        }

        else if (key === "DELETE") {
            if (col > 0) {
                dispatch(updateWords({
                    row: row,
                    col: col - 1,
                    value: {
                        value: "",
                        status: ""
                    }
                }));

                dispatch(setCol(col - 1));
            }
        }

        else {
            if (col < room && row < room) {
                dispatch(updateWords({
                    row: row,
                    col: col,
                    value: {
                        value: key,
                        status: ""
                    }
                }));

                dispatch(setCol(col + 1));
            }
        }
    }

    return (
        <View style={styles.containerStyle}>
            <View style={[{
                display: (progress <= 10) ? "flex" : "none"
            }, styles.progressbar]}>
                <Text style={{
                        fontSize: 20,
                        color: "#F03A47"
                    }}>{progress}</Text>
            </View>
            <View style={{
                paddingTop: 100,
                paddingHorizontal: 10,
                width: "100%",
                alignItems: "center",
                gap: 5
            }}>
                { words.map((colValues, rowIndex) => (
                    <Row
                        key={`row_${rowIndex}`}
                        row={row}
                        rowIndex={rowIndex}
                        colValues={colValues}
                    />
                )) }
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
            
            { false && (
                <Loading
                    message={"Oyuncu bekleniyor..."}
                />
            )}
        </View>
    );
}

export default Game;

const styles = StyleSheet.create({
    containerStyle: {
        flex: 1,
        backgroundColor: 'white'
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
});