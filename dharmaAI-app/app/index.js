import { Redirect } from "expo-router";

// Entry route "/": no UI, it only routes the user to Home.
export default function Index() {
    return <Redirect href="/Home" />;
}