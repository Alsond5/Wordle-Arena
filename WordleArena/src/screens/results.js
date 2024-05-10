import React, { useEffect, useState, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, Image, Animated, Easing, Alert, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

import { useSelector, useDispatch } from 'react-redux';
import { Row, Card } from '@/components';
import { setGameStatus, setWaiting, setWords } from '@/redux/game-slice';
import { sendMessage } from '@/redux/socket-slice';

const Results = ({ navigation }) => {
    const { opponent, words, row, opponentsWords, results, requestDetails } = useSelector((state) => state.game);
    const { username } = useSelector((state) => state.user);

    const dispatch = useDispatch();

    const [progress, setProgress] = useState(10);
    const [intervalId, setIntervalId] = useState(null);

    const startCountdown = (s) => {
        setProgress(s);

        const id = setInterval(() => {
            setProgress((prev) => {
                if (prev === 0) {
                    return 0;
                }

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

        setProgress(30);
    }


    useEffect(() => {
        if (!navigation.isFocused()) return;

        dispatch(setGameStatus(null));
        const id = startCountdown(30);

        return () => {
            clearInterval(id);
        }
    }, []);

    useEffect(() => {
        if (progress === 0) {
            stopCountdown();
            navigation.navigate("Rooms");
        }
    }, [progress, intervalId]);

    useEffect(() => {
        if (requestDetails) {
            stopCountdown();
        }
    }, [requestDetails])

    const battle = ({ uid }) => {
        dispatch(sendMessage({
            op: 4,
            d: {
                uid: uid
            }
        }))
    }

    return (
        <View style={styles.container}>
            <View style={styles.winnerContainer}>
                <Text style={{ color: "#23BA65", fontSize: 32, fontWeight: "bold", letterSpacing: 3 }}>KAZANAN</Text>
                <Text style={{ color: "#1d2e1e", fontSize: 20, fontWeight: "500", letterSpacing: 1, marginTop: 10 }}>{results.winner}</Text>
            </View>
            <View style={styles.scoreboard}>
                <View style={styles.userResultContainer}>
                    <Text style={{ color: "#1d2e1e", fontSize: 15, fontWeight: "bold", letterSpacing: 0.5, backgroundColor: "#D8DCF0", paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5 }}>{username}</Text>
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#57737A", fontSize: 25, fontWeight: "500", letterSpacing: 10 }}>{results.other_player_word}</Text>
                        <View style={{
                            marginTop: 30,
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
                        
                        <View style={{ marginTop: 30 }}>
                            <Text style={{ fontSize: 17, fontWeight: 500, color: "#1D2E1E" }}>{results.player_score}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.userResultContainer}>
                    <Text style={{ color: "#1d2e1e", fontSize: 15, fontWeight: "bold", letterSpacing: 0.5, backgroundColor: "#D8DCF0", paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5 }}>{opponent.username}</Text>
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#57737A", fontSize: 25, fontWeight: "500", letterSpacing: 10 }}>{results.player_word}</Text>
                        <View style={{
                            marginTop: 30,
                            width: "100%",
                            alignItems: "center",
                            gap: 5
                        }}>
                            { opponentsWords.map((colValues, rowIndex) => (
                                <Row
                                    key={`row_${rowIndex}`}
                                    row={row}
                                    rowIndex={rowIndex}
                                    colValues={colValues}
                                />
                            )) }
                        </View>
                        
                        <View style={{ marginTop: 30 }}>
                            <Text style={{ fontSize: 17, fontWeight: 500, color: "#1D2E1E" }}>{results.other_player_score}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={{
                width: 50,
                height: 50,
                backgroundColor: "#D8DCF0",
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                marginTop: "auto"
            }} onPress={() => {
                dispatch(setGameStatus(null));
                dispatch(setWaiting(true));
                battle({ uid: opponent.uid });
                navigation.navigate('WordConfirmation');
            }}>
                <Image
                    source={require('@assets/battle.png')}
                    style={{ width: 20, height: 20 }}
                />
            </TouchableOpacity>

            <TouchableOpacity style={{
                width: "80%",
                height: 50,
                backgroundColor: "#23BA65",
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 30,
                marginBottom: 30
            }} onPress={() => navigation.navigate("Rooms")}>
                <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "bold" }}>Odaya geri dön</Text>
            </TouchableOpacity>

            { requestDetails && <Card
                message={`${requestDetails.from.username} tarafından düello daveti alındı. Katılmak ister misin?`}
                yes={() => {
                    dispatch(sendMessage({ op: 5, d: { game_id: requestDetails.game_id } }));
                    navigation.navigate('WordConfirmation');
                }}
                no={() => dispatch(sendMessage({ op: 6, d: { game_id: requestDetails.game_id } }))}
            /> }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: Constants.statusBarHeight,
        backgroundColor: "#FFF"
    },
    winnerContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
        marginTop: "5%"
    },
    scoreboard: {
        width: "100%",
        height: "50%",
        marginTop: "10%",
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    userResultContainer: {
        width: "47%",
        height: "100%",
        backgroundColor: "#F8F8F8",
        borderRadius: 10,
        paddingVertical: 20,
        paddingHorizontal: 10,
        alignItems: "center"
    }
});

export default Results;