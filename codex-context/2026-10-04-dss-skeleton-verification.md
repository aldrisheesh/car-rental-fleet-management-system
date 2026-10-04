# Decision-support skeleton loading

Implemented local loading placeholders for Demand Forecast, Fleet Allocation, and Vehicle Utilization using the existing Skeleton component and screen layouts. External advisory checks have an independent skeleton; decision acknowledgement and approval/rejection stay disabled while those checks run. Screen-reader status text and reduced-motion styling are included.

## Verification

- Production build passed.
- Focused ESLint for changed DSS components passed.
- Browser: observed Demand Forecast and Fleet Allocation skeletons when entering from Dashboard, then verified loaded controls and data.
- Browser: observed Vehicle Utilization skeleton on Refresh analysis, then verified the real vehicle table returns.
- Browser: selecting the Sedan recommendation for Oct 5 showed the advisory loader and disabled decision controls, then resolved to weather, road, and route evidence.
- Screenshot: output/dss-skeletons/utilization-loading.jpg.

No database reset, allocation approval, vehicle movement, commit, or deployment was performed. This is loading presentation; forecasting and allocation logic are unchanged.
