import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export const useHaptics = () => {
	const light = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}, []);

	const medium = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	}, []);

	const heavy = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
	}, []);

	const selection = useCallback(() => {
		Haptics.selectionAsync();
	}, []);

	const success = useCallback(() => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	}, []);

	const error = useCallback(() => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
	}, []);

	const warning = useCallback(() => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	}, []);

	return {
		light,
		medium,
		heavy,
		selection,
		success,
		error,
		warning,
	};
};
