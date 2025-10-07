import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppBodyLoadedContents from './AppBodyLoadedContents';

// Mocking ParalogMap component
jest.mock('../Map/ParalogMap', () => () => <div data-testid="paralog-map">Paralog Map</div>);

describe('AppBodyLoadedContents Component', () => {
    it('should render ParalogMap', () => {
        render(<AppBodyLoadedContents />);

        // Verify ParalogMap renders
        expect(screen.getByTestId('paralog-map')).toBeInTheDocument();
    });
});
