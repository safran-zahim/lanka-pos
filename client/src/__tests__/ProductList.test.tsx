import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: () => []
}));

import { ProductList } from '../pages/admin/ProductList';

describe('ProductList tabs', () => {
    it('switches to Categories tab', async () => {
        render(<ProductList />);
        const tab = screen.getByRole('button', { name: /categories/i });
        await userEvent.click(tab);
        expect(screen.getByRole('heading', { name: /categories/i })).toBeInTheDocument();
    });
});
