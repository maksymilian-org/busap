import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search, ArrowRight, Clock, Bus } from 'lucide-react-native';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');

  const recentSearches = [
    { from: 'Warszawa Centralna', to: 'Kraków Dworzec' },
    { from: 'Gdańsk Główny', to: 'Warszawa Centralna' },
  ];

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-6">
          <Text
            className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            Szukaj połączenia
          </Text>
          <Text className="text-gray-500 mt-1">
            Znajdź autobus i sprawdź rozkład
          </Text>
        </View>

        {/* Search form */}
        <View
          className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          {/* From input */}
          <View className="mb-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Skąd
            </Text>
            <View
              className={`flex-row items-center rounded-xl px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <MapPin size={20} color="#6b7280" />
              <TextInput
                className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
                placeholder="Przystanek początkowy"
                placeholderTextColor="#9ca3af"
                value={fromStop}
                onChangeText={setFromStop}
              />
            </View>
          </View>

          {/* To input */}
          <View className="mb-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Dokąd
            </Text>
            <View
              className={`flex-row items-center rounded-xl px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <MapPin size={20} color="#10b981" />
              <TextInput
                className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
                placeholder="Przystanek końcowy"
                placeholderTextColor="#9ca3af"
                value={toStop}
                onChangeText={setToStop}
              />
            </View>
          </View>

          {/* Search button */}
          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Search size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Szukaj
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent searches */}
        <View className="mt-6">
          <Text
            className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            Ostatnie wyszukiwania
          </Text>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              activeOpacity={0.7}
              onPress={() => {
                setFromStop(search.from);
                setToStop(search.to);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  <Bus size={20} color="#10b981" />
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text
                      className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {search.from}
                    </Text>
                    <ArrowRight size={14} color="#9ca3af" className="mx-2" />
                    <Text
                      className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {search.to}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
