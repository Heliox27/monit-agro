import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginSelect from "./screens/LoginSelect";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="LoginSelect"
          component={LoginSelect}
          options={{ title: "Seleccionar finca" }}
        />
        {/* Aquí luego agregaremos Dashboard, Históricos, etc. */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
