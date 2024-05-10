import { View, Text, Image, StyleSheet, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/redux/user-slice';

import Constants from 'expo-constants';

import { Button, SelectBox, UserView } from '@/components';
import { useEffect, useRef } from 'react';
import { connect, sendMessage } from '@/redux/socket-slice';
import { setChannel, setRoom } from '@/redux/channel-slice';
import Card from '@/components/card';
import { setGameStatus, setWaiting } from '@/redux/game-slice';

const Rooms = ({ navigation }) => {
    const { user } = useSelector((state) => state.user);
    const { channel, room, users } = useSelector((state) => state.channel);
    const { requestDetails, gameStatus } = useSelector((state) => state.game);
    const { message } = useSelector((state) => state.socket);

    const dispatch = useDispatch();

    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        dispatch(connect({ token: user.token }));
    }, []);

    useEffect(() => {
        console.info(message);
    }, [message]);

    useEffect(() => {
        if (!channel || !room) {
            return;
        }

        dispatch(sendMessage({
            op: 3,
            d: {
                channel: channel,
                room: room
            }
        }));
    }, [channel, room]);

    useEffect(() => {
        if (gameStatus === "start") {
            navigation.navigate('Game');
        }
    }, [gameStatus])

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
            <View style={styles.topHeader}>
                <View style={styles.userDetailsContainer}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                        <View style={styles.profileContainer}>
                            <Image
                                source={require('@assets/profile.png')}
                                style={{ width: 21, height: 21 }}
                            />
                        </View>
                        <Text style={styles.textStyle}>{user.username}</Text>
                    </View>
                    <View style={styles.pointContainer}>
                        <Text style={{ fontWeight: "bold", color: "#1E1D2E" }}>Puan: </Text>
                        <Text style={[{ fontWeight: "500", color: "white" }, { marginLeft: 3, marginTop: 0.5 }]}>{(1000000).toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.selectContainer}>
                    <View style={styles.selectContent}>
                        <SelectBox
                            onPress={(item) => dispatch(setChannel(item))}
                            title="Bir kanal seçin"
                            items={["harfli", "harfsiz"]}
                            activeItem={channel}
                        />
                        <SelectBox
                            onPress={(item) => dispatch(setRoom(item))}
                            title="Bir kanal seçin"
                            items={[4, 5, 6, 7]}
                            activeItem={room}
                        />
                    </View>
                </View>
            </View>
            <View style={styles.channelsContainer}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }}>
                    { users.map((user, index) => (
                        <UserView key={`user${index}`} onPress={() => {
                            dispatch(setGameStatus(null));
                            dispatch(setWaiting(true));
                            battle({ uid: user.uid });
                            navigation.navigate('WordConfirmation');
                        }} userDetails={ { username: user.username, status: user.status, uid: user.uid }} opacity={opacity} />
                    )) }
                </ScrollView>
            </View>
            
            { (gameStatus === "start" || gameStatus === "other_player_finished") && 
                <View style={{ width: "100%", alignItems: "center", justifyContent: "center", position: "relative", bottom: 50 }}>
                    <TouchableOpacity style={styles.gameButton} onPress={() => navigation.navigate("Game")}>
                        <Text style={{ color: "white" }}>Oyuna geri dön</Text>
                    </TouchableOpacity>
                </View>
            }

            { gameStatus === "accept" && 
                <View style={{ width: "100%", alignItems: "center", justifyContent: "center", position: "relative", bottom: 50 }}>
                    <TouchableOpacity style={styles.gameButton} onPress={() => navigation.navigate("WordConfirmation")}>
                        <Text style={{ color: "white" }}>Oyuna geri dön</Text>
                    </TouchableOpacity>
                </View>
            }
            
            { requestDetails && <Card
                message={`${requestDetails.from.username} tarafından düello daveti alındı. Katılmak ister misin?`}
                yes={() => {
                    dispatch(sendMessage({ op: 5, d: { game_id: requestDetails.game_id } }));
                    navigation.navigate('WordConfirmation');
                }}
                no={() => dispatch(sendMessage({ op: 6, d: { game_id: requestDetails.game_id } }))}
            /> }
        </View>
    );
}

export default Rooms;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Constants.statusBarHeight,
        backgroundColor: "white"
    },
    topHeader: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#1e1d2e',
        zIndex: 100
    },
    userDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: "100%",
        height: 71,
        backgroundColor: '#404855',
        borderRadius: 10,
        paddingHorizontal: 20
    },
    largeText: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#1e1d2e"
    },
    textStyle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: "bold"
    },
    profileContainer: {
        width: 35,
        height: 35,
        borderRadius: 25,
        backgroundColor: '#D8DCF0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pointContainer: {
        marginLeft: "auto",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 7,
        backgroundColor: "#23BA65",
        borderRadius: 10
    },
    selectContainer: {
        width: '100%',
        height: 50,
        position: "relative",
        marginTop: 15
    },
    selectContent: {
        width: '100%',
        flexDirection: "row",
        gap: 20,
        alignItems: "center",
        position: "absolute",
        top: 0
    },
    channelsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 15
    },
    gameButton: {
        position: "absolute",
        backgroundColor: "#23BA65",
        width: "50%",
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        // transform: [{ translateX:  }]
    }
});