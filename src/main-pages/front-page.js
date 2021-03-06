import React, { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';
import DisplayPage, { ThisMatters } from '../components/display-page';
import ThreadCreator from '../components/thread-creator';
import ReplyCreator from '../components/reply-creator';
import Login from '../components/login';
import Logout from '../components/logout';
import Refresh from '../components/refresh';
import { isAdmin } from '../helpers/firebase';

const firebaseApp = window.firebaseApp;
export default function FrontPage({}) {
    const [threads, setThreads] = useState([]);

    const [loggedIn, setLoggedIn] = useState(false);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const getData = async () => {
            const threadDisplay = await firebaseApp
                .database()
                .ref('/threads/')
                .once('value');
            const val = threadDisplay.val();
            const keys = val ? Object.keys(val) : [];
            const basedThreads = keys.map((threadKey) => {
                const RET = val[threadKey];
                const keys = RET.replies ? Object.keys(RET.replies) : [];
                const basedReplies = keys.map((replyKey) => {
                    return RET.replies[replyKey];
                });
                RET.replies = basedReplies;
                return RET;
            });
            setThreads(basedThreads);
        };
        getData();
    }, [refresh]);

    useEffect(() => {
        const getAdmin = async () => {
            const admin = await isAdmin({ firebaseApp, uid: loggedIn.uid });
            if (admin !== loggedIn.admin) {
                setLoggedIn({ ...loggedIn, admin });
            }
        };
        if (loggedIn) {
            getAdmin();
        }
    }, [loggedIn]);

    const signIn = ({ user }) => {
        const { email, uid } = user;
        setLoggedIn({ email, uid });
    };

    const signOut = () => {
        setLoggedIn(false);
    };

    const newThread = async (newThread) => {
        if (loggedIn) {
            var postsRef = firebaseApp.database().ref('threads');

            var newPostRef = postsRef.push();
            await newPostRef.set({
                content: newThread.content,
                email: loggedIn.email,
                title: newThread.title,
                threadID: newPostRef.key,
            });
            setRefresh(!refresh);
        }
    };

    const addReply = async ({ threadID, reply }) => {
        if (loggedIn) {
            var postsRef = firebaseApp
                .database()
                .ref(`threads/${threadID}/replies`);

            var newPostRef = postsRef.push();
            await newPostRef.set({
                content: reply.content,
                email: loggedIn.email,
                replyID: newPostRef.key,
            });
            setRefresh(!refresh);
        }
    };

    const removeReply = async ({ threadID, replyID }) => {
        if (loggedIn) {
            var postsRef = firebaseApp
                .database()
                .ref(`threads/${threadID}/replies/${replyID}`);

            await postsRef.remove();
            setRefresh(!refresh);
            alert('Reply deleted.');
        }
    };

    const removeThread = async ({ threadID }) => {
        if (loggedIn) {
            var postsRef = firebaseApp.database().ref(`threads/${threadID}`);

            console.log(threadID);
            await postsRef.remove();
            setRefresh(!refresh);
            alert('Thread deleted.');
        }
    };

    const editReply = async ({ threadID, replyID, content }) => {
        if (loggedIn) {
            var postsRef = firebaseApp
                .database()
                .ref(`threads/${threadID}/replies/${replyID}`);

            await postsRef.update({ content });
            setRefresh(!refresh);
            alert('Reply edited.');
        }
    };

    const editThread = async ({ threadID, content }) => {
        if (loggedIn) {
            var postsRef = firebaseApp.database().ref(`threads/${threadID}`);

            await postsRef.update({ content });
            setRefresh(!refresh);
            alert('Thread edited.');
        }
    };

    return (
        <div>
            {!loggedIn ? (
                <Login onSignIn={signIn} />
            ) : (
                <Logout onSignOut={signOut} email={loggedIn.email} />
            )}
            <br></br>
            <br></br>
            <h1>CURRENT THREADS</h1>
            <div className="forum-container">
                {threads && threads.length ? (
                    threads.map((t) => {
                        return (
                            <DisplayPage
                                thread={t}
                                key={t.title}
                                addReply={addReply}
                                replies={t.replies}
                                loggedIn={loggedIn}
                                removeReply={removeReply}
                                onEdit={editReply}
                                removeThread={removeThread}
                                onThredit={editThread}
                            />
                        );
                    })
                ) : (
                    <div>No threads :'(</div>
                )}
            </div>
            {loggedIn && <ThreadCreator onSubmit={newThread} />}

            <Refresh
                onRefresh={() => {
                    setRefresh(!refresh);
                }}
            />
        </div>
    );
}
