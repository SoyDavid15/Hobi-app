import { Platform, StyleSheet, ScrollView, View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { AuthService } from '@/services/auth';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor ingresa correo y contraseña.');
      return;
    }

    if (password.length > 16) {
      setErrorMessage('La contraseña debe tener máximo 16 caracteres.');
      return;
    }

    if (isSignUp) {
      if (!username.trim()) {
        setErrorMessage('Por favor ingresa un nombre de usuario.');
        return;
      }
      if (username.trim().length > 8) {
        setErrorMessage('El nombre de usuario debe tener máximo 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);

    if (isSignUp) {
      const result = await AuthService.signUp(email, password, username.trim());
      setLoading(false);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setVerificationSent(true);
      }
    } else {
      const result = await AuthService.signIn(email, password);
      setLoading(false);
      if (result.error) {
        setErrorMessage(result.error);
      }
    }
  };

  if (verificationSent) {
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: '#FFFFFF' }]}
        contentContainerStyle={styles.contentContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.brand}>Hobi</ThemedText>
            <ThemedText style={[styles.subtitle, { textAlign: 'center', marginTop: Spacing.two }]}>
              Hemos enviado un enlace de confirmación a <ThemedText style={{ fontWeight: '700', color: '#1F1F1F' }}>{email}</ThemedText>. Por favor verifica tu correo electrónico para activar tu cuenta.
            </ThemedText>
          </View>

          <View style={styles.verificationButtons}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setVerificationSent(false);
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
                setUsername('');
              }}>
              <ThemedText style={styles.primaryButtonText}>Ir a Iniciar Sesión</ThemedText>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setVerificationSent(false);
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
                setUsername('');
              }}>
              <ThemedText style={styles.secondaryButtonText}>Volver al login</ThemedText>
            </Pressable>
          </View>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: '#FFFFFF' }]}
      contentContainerStyle={styles.contentContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.brand}>Hobi</ThemedText>
          <ThemedText style={styles.subtitle}>
            {isSignUp ? 'Crea tu cuenta para comenzar' : 'Sal de tu zona de confort'}
          </ThemedText>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {isSignUp && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario (máx. 8 car.)"
                placeholderTextColor="#8E8E93"
                value={username}
                onChangeText={(text) => setUsername(text.slice(0, 8))}
                maxLength={8}
                autoCapitalize="none"
              />
              <ThemedText style={styles.charCounter}>{username.length}/8</ThemedText>
            </View>
          )}

          <View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Contraseña (máx. 16 car.)"
                placeholderTextColor="#8E8E93"
                value={password}
                onChangeText={(text) => setPassword(text.slice(0, 16))}
                maxLength={16}
                secureTextEntry={!showPassword}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#8E8E93"
                />
              </Pressable>
            </View>
            <ThemedText style={styles.charCounter}>{password.length}/16</ThemedText>
          </View>

          {isSignUp && (
            <View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#8E8E93"
                  value={confirmPassword}
                  onChangeText={(text) => setConfirmPassword(text.slice(0, 16))}
                  maxLength={16}
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#8E8E93"
                  />
                </Pressable>
              </View>
              <ThemedText style={styles.charCounter}>{confirmPassword.length}/16</ThemedText>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: isSignUp ? '#6F4E37' : '#00D1B2',
                opacity: pressed || loading ? 0.8 : 1,
              },
            ]}
            onPress={handleEmailAuth}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={styles.switchModeButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }}>
            <ThemedText style={styles.switchModeText}>
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </ThemedText>
          </Pressable>
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.five,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  brand: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6F4E37',
    lineHeight: 70,
    paddingVertical: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.two,
    borderRadius: BorderRadius.small,
    width: '100%',
    maxWidth: 380,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 380,
    gap: Spacing.three,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    backgroundColor: '#F7F6F3',
    color: '#1F1F1F',
  },
  charCounter: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  verificationButtons: {
    width: '100%',
    maxWidth: 380,
    gap: Spacing.two,
  },
  primaryButton: {
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
    width: '100%',
    backgroundColor: '#00D1B2',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  switchModeText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
});
