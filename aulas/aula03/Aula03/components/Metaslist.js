import { ScrollView, Text, StyleSheet } from "react-native";

export default function Metaslist(props) {
    return ( 
        <ScrollView>
            {props.array.map((meta, index) => <Text key={index} style={styles.item}>{meta}</Text>)}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    item: {
        margin: 8,
        borderRadius: 5,
        padding: 10,
        backgroundColor: 'lightblue'
    }
})