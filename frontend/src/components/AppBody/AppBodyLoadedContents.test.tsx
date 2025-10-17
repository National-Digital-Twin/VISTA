import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppBodyLoadedContents from './AppBodyLoadedContents';

vi.mock('../Map/ParalogMap', () => ({ default: () => <div data-testid="paralog-map">Paralog Map</div> }));

describe('AppBodyLoadedContents Component', () => {
    it('should render ParalogMap', () => {
        render(<AppBodyLoadedContents />);

        expect(screen.getByTestId('paralog-map')).toBeInTheDocument();
    });
});
