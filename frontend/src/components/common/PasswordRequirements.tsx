import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useTranslation } from '../../hooks/useTranslation';
import type { PasswordRulesStatus } from '../../services/passwordValidationService';

interface PasswordRequirementsProps {
  rulesStatus: PasswordRulesStatus;
  showTitle?: boolean;
}

interface RuleItem {
  key: keyof Omit<PasswordRulesStatus, 'isValid' | 'hasMaxLength'>;
  translationKey: string;
}

const rules: RuleItem[] = [
  { key: 'hasMinLength', translationKey: 'RULE_MIN_LENGTH' },
  { key: 'hasUppercase', translationKey: 'RULE_UPPERCASE' },
  { key: 'hasLowercase', translationKey: 'RULE_LOWERCASE' },
  { key: 'hasDigit', translationKey: 'RULE_DIGIT' },
  { key: 'hasSpecialChar', translationKey: 'RULE_SPECIAL' },
  { key: 'hasNoSpaces', translationKey: 'RULE_NO_SPACES' },
  { key: 'hasNoSequential', translationKey: 'RULE_NO_SEQUENTIAL' },
];

export default function PasswordRequirements({ rulesStatus, showTitle = true }: PasswordRequirementsProps) {
  const { t } = useTranslation('PasswordValidation');

  const getRuleStatus = (key: keyof Omit<PasswordRulesStatus, 'isValid' | 'hasMaxLength'>): boolean => {
    return rulesStatus[key];
  };

  return (
    <Box sx={{ minWidth: 300, pt: 2 }}>
      {showTitle && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {t('PASSWORD_REQUIREMENTS_TITLE')}
        </Typography>
      )}
      <List dense disablePadding>
        {rules.map((rule) => {
          const isCompleted = getRuleStatus(rule.key);
          return (
            <ListItem key={rule.key} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                {isCompleted ? (
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={t(rule.translationKey)}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: isCompleted ? 'success.main' : 'text.secondary',
                  sx: { 
                    fontSize: '0.75rem',
                    fontWeight: isCompleted ? 500 : 400
                  }
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
