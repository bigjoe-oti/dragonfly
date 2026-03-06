import {
    useEffect,
    useRef,
    useState
} from 'react';

export function useAIArchitect() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState('idle');
    const [data, setData] = useState({
        blueprint: null,
        n8n: null,
        prompt: null,
    });
    const [error, setError] = useState(null);
    const phaseTimerRef = useRef(null);

    const clearData = () => {
        setData({
            blueprint: null,
            n8n: null,
            prompt: null,
        });
        setError(null);
    };

    // Expose a hydration function so App.jsx can restore data from a URL hash
    // without requiring a full prop-drilling refactor of the hook interface.
    useEffect(() => {
        window.__jservoHydrateData = (payload) => {
            // If the payload is a full results object, replace it.
            // If it's a legacy single result, try to detect where it belongs or put it in blueprint.
            if (payload && (payload.blueprint || payload.roi || payload.architecture)) {
                setData((prev) => ({
                    ...prev,
                    blueprint: payload,
                }));
            } else if (payload && payload.promptOutput) {
                setData((prev) => ({
                    ...prev,
                    prompt: payload,
                }));
            } else {
                setData(payload);
            }
        };
        return () => {
            delete window.__jservoHydrateData;
        };
    }, []);

    const generateArchitecture = async (problemDescription, mode = 'blueprint') => {
        // Clear any lingering phase timer
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);

        setIsLoading(true);
        setError(null);

        // Set initial loading phase based on mode
        if (mode === 'blueprint') {
            setLoadingPhase('parsing');
            // After 3s, assume Phase 1 is done and we are in Phase 2 (architecture rendering)
            phaseTimerRef.current = setTimeout(() => setLoadingPhase('rendering'), 3000);
        } else {
            // n8n and prompt are single-phase — go straight to rendering
            setLoadingPhase('rendering');
        }

        try {
            const apiBaseUrl =
                import.meta.env.VITE_API_BASE_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/architect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problemDescription,
                    mode,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    'Failed to generate architecture. Server responded with ' + response.status
                );
            }

            const result = await response.json();
            // Store the result for the specific mode, preserving others
            setData((prev) => ({
                ...prev,
                [mode]: result,
            }));
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
            console.error(err);
        } finally {
            if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
            setIsLoading(false);
            setLoadingPhase('idle');
        }
    };

    return {
        isLoading,
        loadingPhase,
        data,
        error,
        generateArchitecture,
        clearData,
    };
}