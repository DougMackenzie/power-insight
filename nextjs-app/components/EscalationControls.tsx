'use client';

/**
 * EscalationControls Component
 * Toggle controls for inflation and infrastructure aging cost escalation
 */

import { ESCALATION_RANGES } from '@/lib/constants';

interface EscalationControlsProps {
    inflationEnabled: boolean;
    setInflationEnabled: (enabled: boolean) => void;
    inflationRate: number;
    setInflationRate: (rate: number) => void;
    infrastructureAgingEnabled: boolean;
    setInfrastructureAgingEnabled: (enabled: boolean) => void;
    infrastructureAgingRate: number;
    setInfrastructureAgingRate: (rate: number) => void;
}

export const EscalationControls = ({
    inflationEnabled,
    setInflationEnabled,
    inflationRate,
    setInflationRate,
    infrastructureAgingEnabled,
    setInfrastructureAgingEnabled,
    infrastructureAgingRate,
    setInfrastructureAgingRate,
}: EscalationControlsProps) => {
    return (
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-gray-700">
                Baseline Cost Escalation
            </h4>
            <p className="text-xs text-gray-500 -mt-1">
                Toggle to see how inflation and infrastructure costs affect bills over time (without data center)
            </p>

            {/* Inflation Toggle + Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center gap-2 cursor-pointer min-w-[140px]">
                    <input
                        type="checkbox"
                        checked={inflationEnabled}
                        onChange={(e) => setInflationEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Inflation</span>
                </label>
                {inflationEnabled && (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="range"
                            min={ESCALATION_RANGES.inflation.min}
                            max={ESCALATION_RANGES.inflation.max}
                            step={ESCALATION_RANGES.inflation.step}
                            value={inflationRate}
                            onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700 w-14 text-right">
                            {(inflationRate * 100).toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Infrastructure Aging Toggle + Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center gap-2 cursor-pointer min-w-[140px]">
                    <input
                        type="checkbox"
                        checked={infrastructureAgingEnabled}
                        onChange={(e) => setInfrastructureAgingEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Infrastructure Aging</span>
                </label>
                {infrastructureAgingEnabled && (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="range"
                            min={ESCALATION_RANGES.infrastructureAging.min}
                            max={ESCALATION_RANGES.infrastructureAging.max}
                            step={ESCALATION_RANGES.infrastructureAging.step}
                            value={infrastructureAgingRate}
                            onChange={(e) => setInfrastructureAgingRate(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                        <span className="text-sm font-medium text-gray-700 w-14 text-right">
                            {(infrastructureAgingRate * 100).toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Combined rate display when both enabled */}
            {(inflationEnabled || infrastructureAgingEnabled) && (
                <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                    Combined annual escalation:{' '}
                    <span className="font-medium text-gray-700">
                        {(
                            ((inflationEnabled ? inflationRate : 0) +
                                (infrastructureAgingEnabled ? infrastructureAgingRate : 0)) *
                            100
                        ).toFixed(1)}
                        %
                    </span>
                </div>
            )}
        </div>
    );
};

export default EscalationControls;
