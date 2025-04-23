import { createRoom } from '@/app/rooms/new/roomService';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { addDoc, collection } from 'firebase/firestore';

describe('createRoom - Validation', () => {
	it('should reject when room name is empty', async () => {
		// Arrange
		const emptyName = '';
		const communityId = 'UIyd1HlGNJACSPUNP2pl';
		const adminId = '2';

		// Act & Assert
		await expect(
			createRoom(emptyName, communityId, adminId)
		).rejects.toThrow('Le nom de la room ne peut pas être vide !');
	});

	it('should reject when room name is only whitespace', async () => {
		// Arrange
		const whitespaceName = '   ';
		const communityId = 'UIyd1HlGNJACSPUNP2pl';
		const adminId = '2';

		// Act & Assert
		await expect(
			createRoom(whitespaceName, communityId, adminId)
		).rejects.toThrow('Le nom de la room ne peut pas être vide !');
	});
});
