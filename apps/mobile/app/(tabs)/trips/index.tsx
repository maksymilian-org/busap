import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MapPin, Bus, ChevronRight } from 'lucide-react-native';

export default function TripsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const upcomingTrips = [
    {
      id: '1',
      route: 'Warszawa - Kraków',
      company: 'PKS Polonus',
      departure: '14:30',
      arrival: '17:45',
      date: 'Dzisiaj',
      stops: [
        { name: 'Warszawa Centralna', time: '14:30' },
        { name: 'Radom', time: '15:45' },
        { name: 'Kielce', time: '16:30' },
        { name: 'Kraków Dworzec', time: '17:45' },
      ],
    },
  ];

  const pastTrips = [
    {
      id: '2',
      route: 'Gdańsk - Warszawa',
      company: 'FlixBus',
      departure: '08:00',
      arrival: '12:30',
      date: '15 sty 2024',
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-6">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Moje podróże
          </Text>
          <Text className="text-gray-500 mt-1">
            Nadchodzące i przeszłe podróże
          </Text>
        </View>

        {/* Upcoming trips */}
        <View className="mb-6">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Nadchodzące
          </Text>
          {upcomingTrips.length > 0 ? (
            upcomingTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {trip.route}
                    </Text>
                    <Text className="text-gray-500 text-sm">{trip.company}</Text>
                  </View>
                  <View className="bg-primary-100 px-3 py-1 rounded-full">
                    <Text className="text-primary-700 text-sm font-medium">
                      {trip.date}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Clock size={16} color="#6b7280" />
                  <Text className="text-gray-500 text-sm ml-2">
                    {trip.departure} - {trip.arrival}
                  </Text>
                </View>

                <View className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-500 text-sm">
                      {trip.stops.length} przystanków
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-primary-500 text-sm font-medium">
                        Szczegóły
                      </Text>
                      <ChevronRight size={16} color="#10b981" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className={`rounded-2xl p-6 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Bus size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-3 text-center">
                Brak nadchodzących podróży
              </Text>
            </View>
          )}
        </View>

        {/* Past trips */}
        <View className="mb-6">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Historia
          </Text>
          {pastTrips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {trip.route}
                  </Text>
                  <Text className="text-gray-500 text-sm">{trip.company}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={14} color="#6b7280" />
                    <Text className="text-gray-500 text-sm ml-1">
                      {trip.date} • {trip.departure}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
