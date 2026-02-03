import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Bell,
  Globe,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const menuItems = [
    { icon: Bell, label: 'Powiadomienia', href: '/notifications' },
    { icon: Globe, label: 'Język', value: 'Polski', href: '/language' },
    { icon: Moon, label: 'Wygląd', value: 'Automatyczny', href: '/appearance' },
    { icon: Shield, label: 'Prywatność', href: '/privacy' },
    { icon: HelpCircle, label: 'Pomoc', href: '/help' },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-6">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Profil
          </Text>
        </View>

        {/* User card */}
        <TouchableOpacity
          className={`rounded-2xl p-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
              <User size={32} color="#10b981" />
            </View>
            <View className="flex-1 ml-4">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Jan Kowalski
              </Text>
              <Text className="text-gray-500">jan@example.com</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Menu */}
        <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center px-4 py-4 ${
                index < menuItems.length - 1
                  ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`
                  : ''
              }`}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center">
                <item.icon size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
              </View>
              <Text className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.label}
              </Text>
              {item.value && (
                <Text className="text-gray-500 text-sm mr-2">{item.value}</Text>
              )}
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout button */}
        <TouchableOpacity
          className={`rounded-2xl p-4 mt-6 mb-8 flex-row items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2">Wyloguj się</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text className="text-center text-gray-400 text-sm mb-6">
          Busap v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
