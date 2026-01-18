// Guarded Stripe helpers (no native import on web)
import { Platform } from 'react-native';

type PaymentSheetInit = {
	customerId: string;
	ephemeralKey: string;
	clientSecret: string;
};

async function callFn(name: string, body: any): Promise<PaymentSheetInit> {
	// TODO replace base URL with your deployed callable functions endpoint.
	const base = 'https://us-central1-your-project.cloudfunctions.net';
	const res = await fetch(`${base}/${name}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error('Stripe function failed');
	return res.json();
}

export async function donate(amountCents: number) {
	if (Platform.OS === 'web') return { unsupported: true } as const;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native');
	const init = await callFn('createDonationIntent', { amount: amountCents });
	const sheet = await initPaymentSheet({
		customerId: init.customerId,
		customerEphemeralKeySecret: init.ephemeralKey,
		paymentIntentClientSecret: init.clientSecret,
		allowsDelayedPaymentMethods: false,
	});
	if (sheet.error) throw sheet.error;
	const presented = await presentPaymentSheet();
	if (presented.error) throw presented.error;
	return { success: true };
}

export async function subscribePremium(priceId: string) {
	if (Platform.OS === 'web') return { unsupported: true } as const;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native');
	const init = await callFn('createPremiumSubscription', { priceId });
	const sheet = await initPaymentSheet({
		customerId: init.customerId,
		customerEphemeralKeySecret: init.ephemeralKey,
		setupIntentClientSecret: init.clientSecret,
		allowsDelayedPaymentMethods: true,
	});
	if (sheet.error) throw sheet.error;
	const presented = await presentPaymentSheet();
	if (presented.error) throw presented.error;
	return { success: true };
}
