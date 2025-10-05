import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, User, Activity, TrendingUp } from "lucide-react";
import type { Client, User as UserType } from "@shared/schema";
import { calculateTDEEFromClient, ACTIVITY_LEVELS, type ActivityLevelKey } from "@/lib/tdeeCalculator";

type ClientWithUser = Client & { user?: UserType };

interface TDEECalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientWithUser[];
  onApplyTDEE: (tdee: number) => void;
}

export function TDEECalculatorDialog({ 
  open, 
  onOpenChange, 
  clients, 
  onApplyTDEE 
}: TDEECalculatorDialogProps) {
  const { t } = useTranslation();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [calculationResult, setCalculationResult] = useState<{
    bmr: number;
    tdee: number;
    activityLevel: string;
  } | null>(null);

  const handleCalculate = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    const result = calculateTDEEFromClient(client);
    if (result) {
      setCalculationResult(result);
    }
  };

  const handleApply = () => {
    if (calculationResult) {
      onApplyTDEE(calculationResult.tdee);
      onOpenChange(false);
      // Reset state
      setSelectedClientId("");
      setCalculationResult(null);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const canCalculate = selectedClient && 
    selectedClient.weight && 
    selectedClient.height && 
    selectedClient.age && 
    selectedClient.gender;

  const getActivityLevelLabel = (level: string) => {
    const normalized = level.toLowerCase().replace(/[\s-_]/g, '');
    const levelMap: Record<string, ActivityLevelKey> = {
      'sedentary': 'sedentary',
      'lightlyactive': 'light',
      'light': 'light',
      'moderate': 'moderate',
      'moderatelyactive': 'moderate',
      'active': 'active',
      'veryactive': 'veryActive',
      'extremelyactive': 'veryActive'
    };
    const mappedLevel = levelMap[normalized] || 'moderate';
    return t(ACTIVITY_LEVELS[mappedLevel].translationKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-tdee-calculator">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>{t('tdee.calculator')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div>
            <Label className="text-sm font-medium mb-2">{t('tdee.selectClient')}</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full" data-testid="select-client-tdee">
                <div className="flex items-center space-x-2">
                  {selectedClient && <User className="h-4 w-4" />}
                  <SelectValue placeholder={t('tdee.selectClientPlaceholder')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem 
                    key={client.id} 
                    value={client.id}
                  >
                    {client.user?.firstName} {client.user?.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Data Preview */}
          {selectedClient && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                {t('tdee.clientData')}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('tdee.weight')}:</span>
                  <span className="ml-2 font-medium" data-testid="text-client-weight">
                    {selectedClient.weight ? `${selectedClient.weight} kg` : t('tdee.notProvided')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('tdee.height')}:</span>
                  <span className="ml-2 font-medium" data-testid="text-client-height">
                    {selectedClient.height ? `${selectedClient.height} cm` : t('tdee.notProvided')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('tdee.age')}:</span>
                  <span className="ml-2 font-medium" data-testid="text-client-age">
                    {selectedClient.age ? `${selectedClient.age} ${t('tdee.years')}` : t('tdee.notProvided')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('tdee.gender')}:</span>
                  <span className="ml-2 font-medium capitalize" data-testid="text-client-gender">
                    {selectedClient.gender ? t(`common.${selectedClient.gender}`) : t('tdee.notProvided')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">{t('tdee.activityLevel')}:</span>
                  <span className="ml-2 font-medium" data-testid="text-client-activity">
                    {selectedClient.activityLevel ? getActivityLevelLabel(selectedClient.activityLevel) : t('tdee.notProvided')}
                  </span>
                </div>
              </div>
              {!canCalculate && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2" data-testid="text-missing-data-warning">
                  {t('tdee.missingData')}
                </p>
              )}
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="w-full"
            data-testid="button-calculate-tdee"
          >
            <Activity className="h-4 w-4 mr-2" />
            {t('tdee.calculate')}
          </Button>

          {/* Calculation Results */}
          {calculationResult && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>{t('tdee.results')}</span>
              </h4>
              
              <div className="space-y-3">
                {/* BMR */}
                <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('tdee.bmr')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('tdee.bmrDescription')}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-bmr-result">
                    {calculationResult.bmr} {t('tdee.cal')}
                  </span>
                </div>

                {/* TDEE */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('tdee.tdee')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('tdee.tdeeDescription')}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-tdee-result">
                    {calculationResult.tdee} {t('tdee.cal')}
                  </span>
                </div>
              </div>

              {/* Apply Button */}
              <Button
                onClick={handleApply}
                className="w-full"
                variant="default"
                data-testid="button-apply-tdee"
              >
                {t('tdee.applyToMealPlan')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
