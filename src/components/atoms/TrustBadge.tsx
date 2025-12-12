import React from 'react';
import { Shield, CheckCircle, Star, Award, Sparkles, AlertCircle } from 'lucide-react';

export type TrustLevel =
  | 'guest'
  | 'user'
  | 'verified'
  | 'community'
  | 'expert'
  | 'outdated'
  | 'admin';

interface TrustBadgeProps {
    level: TrustLevel;
    className?: string;
    showIcon?: boolean;
    showLabel?: boolean;
    label?: string;
}

const BADGE_CONFIG = {
    guest: {
        label: 'Guest',
        icon: Shield,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
    },
    user: {
        label: 'User',
        icon: Shield,
        className: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    verified: {
        label: 'Verified',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-600 border-green-200',
    },
    community: {
        label: 'Community',
        icon: Sparkles,
        className: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    expert: {
        label: 'Expert',
        icon: Star,
        className: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    outdated: {
        label: 'Outdated',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-500 border-gray-200',
    },
    admin: {
        label: 'Admin',
        icon: Award,
        className: 'bg-purple-50 text-purple-600 border-purple-200',
    },
};

export default function TrustBadge({ level, className = '', showIcon = true, showLabel = true, label }: TrustBadgeProps) {
    const config = BADGE_CONFIG[level] || BADGE_CONFIG.guest;
    const Icon = config.icon;
    const labelText = label || config.label;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
        >
            {showIcon && <Icon className="w-3 h-3" />}
            {showLabel && <span>{labelText}</span>}
        </span>
    );
}
