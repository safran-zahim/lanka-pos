import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: () => []
}));

import { ProductList } from '../pages/admin/ProductList';

describe('ProductList tabs', () => {
    it('switches to Categories tab', async () => {
        render(
            <MemoryRouter>
                <ProductList />
            </MemoryRouter>
        );
        const tab = screen.getByRole('button', { name: /categories/i });
        await userEvent.click(tab);
        expect(screen.getByRole('heading', { name: /^Categories$/, level: 2 })).toBeInTheDocument();
    });
});
