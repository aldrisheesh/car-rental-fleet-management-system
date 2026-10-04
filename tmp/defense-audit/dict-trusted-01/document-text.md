# Revised Database Schema and Dictionary

- Document ID: 1cFZhN-b0NAopEX3CzUlIvOgefVMTTXbi2eietaZWEbY
- Revision ID: ANLCKQlLp0G3ZaGm-yajBhVcCig64FrF_gT1izPRUsIp30VsC6lrQOj-IRwlGnrC1ayMqWS6vqDnLbOqtBSEWCvsqH-HCo8L74k6tiDrW8Y
- Selected tab: t.tokiux2rhoh
- Protected controls: 0
- Opaque controls: 0
- Authoritative dropdowns: 0

Protected-control annotations are preservation instructions. Do not insert their displayed placeholder text to recreate a native control.

## Rev Data Schema & Dict (t.tokiux2rhoh)

[P00001 | 1:17 | NORMAL_TEXT]
Data Dictionary

[P00002 | 17:366 | NORMAL_TEXT]
The following data dictionary describes the logical records used by the proposed system. It presents the attributes, data types, field sizes, and purposes of the records needed for the rental workflow and decision-support features. Records identified as proposed will be implemented and tested before they are treated as completed system functions.

[P00003 | 366:368 | NORMAL_TEXT]
[INLINE_OBJECT kix.5mp8b3c3lclf]

[P00004 | 368:376 | NORMAL_TEXT]
[INLINE_OBJECT kix.fe1v2m43s9yx][INLINE_OBJECT kix.6mp7sanzslkf][INLINE_OBJECT kix.ieihtimtdl3v][INLINE_OBJECT kix.x5osd76kjnj4][INLINE_OBJECT kix.srbvwwd6i19i][INLINE_OBJECT kix.tew3drnuanor][INLINE_OBJECT kix.fuc5gsjta6ni]

[P00005 | 376:377 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00006 | 377:378 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00007 | 378:379 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00008 | 379:380 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00009 | 380:382 | NORMAL_TEXT]
[INLINE_OBJECT kix.e5obpkvisuhb]

[P00010 | 382:384 | NORMAL_TEXT]
[INLINE_OBJECT kix.dlxky25igl1s]

[P00011 | 384:385 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00012 | 385:394 | NORMAL_TEXT]
Table 32

[P00013 | 394:426 | NORMAL_TEXT]
Data Dictionary – User Profiles

[P00014 | 429:440 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00015 | 441:451 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00016 | 452:463 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00017 | 464:476 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00018 | 478:481 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00019 | 482:487 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00020 | 488:497 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00021 | 498:577 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. FK to auth.users(id). Required.

[P00022 | 579:585 | NORMAL_TEXT | TABLE row=2 col=0]
email

[P00023 | 586:591 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P00024 | 592:594 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P00025 | 595:668 | NORMAL_TEXT | TABLE row=2 col=3]
Email address associated with the record. Unique when present. Optional.

[P00026 | 670:680 | NORMAL_TEXT | TABLE row=3 col=0]
full_name

[P00027 | 681:686 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00028 | 687:689 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00029 | 690:741 | NORMAL_TEXT | TABLE row=3 col=3]
Name displayed for the application user. Required.

[P00030 | 743:756 | NORMAL_TEXT | TABLE row=4 col=0]
phone_number

[P00031 | 757:762 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P00032 | 763:765 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P00033 | 766:814 | NORMAL_TEXT | TABLE row=4 col=3]
Contact telephone number of the user. Optional.

[P00034 | 816:826 | NORMAL_TEXT | TABLE row=5 col=0]
user_type

[P00035 | 827:832 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P00036 | 833:835 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P00037 | 836:997 | NORMAL_TEXT | TABLE row=5 col=3]
Application role used to distinguish administrative, operational, and customer access. Allowed values: Owner/Admin, Operations Staff, Customer/Renter. Required.

[P00038 | 999:1014 | NORMAL_TEXT | TABLE row=6 col=0]
account_status

[P00039 | 1015:1020 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P00040 | 1021:1023 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00041 | 1024:1075 | NORMAL_TEXT | TABLE row=6 col=3]
Account-state label; defaults to Active. Required.

[P00042 | 1077:1088 | NORMAL_TEXT | TABLE row=7 col=0]
created_at

[P00043 | 1089:1101 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P00044 | 1102:1110 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P00045 | 1111:1164 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when the record was created. Required.

[P00046 | 1166:1177 | NORMAL_TEXT | TABLE row=8 col=0]
updated_at

[P00047 | 1178:1190 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P00048 | 1191:1199 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P00049 | 1200:1255 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time of the latest recorded update. Required.

[P00050 | 1257:1272 | NORMAL_TEXT | TABLE row=9 col=0]
street_address

[P00051 | 1273:1278 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P00052 | 1279:1281 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P00053 | 1282:1330 | NORMAL_TEXT | TABLE row=9 col=3]
Street and house or building address. Optional.

[P00054 | 1332:1341 | NORMAL_TEXT | TABLE row=10 col=0]
barangay

[P00055 | 1342:1347 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P00056 | 1348:1350 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P00057 | 1351:1394 | NORMAL_TEXT | TABLE row=10 col=3]
Barangay portion of the address. Optional.

[P00058 | 1396:1414 | NORMAL_TEXT | TABLE row=11 col=0]
city_municipality

[P00059 | 1415:1420 | NORMAL_TEXT | TABLE row=11 col=1]
TEXT

[P00060 | 1421:1423 | NORMAL_TEXT | TABLE row=11 col=2]
—

[P00061 | 1424:1479 | NORMAL_TEXT | TABLE row=11 col=3]
City or municipality portion of the address. Optional.

[P00062 | 1481:1490 | NORMAL_TEXT | TABLE row=12 col=0]
province

[P00063 | 1491:1496 | NORMAL_TEXT | TABLE row=12 col=1]
TEXT

[P00064 | 1497:1499 | NORMAL_TEXT | TABLE row=12 col=2]
—

[P00065 | 1500:1543 | NORMAL_TEXT | TABLE row=12 col=3]
Province portion of the address. Optional.

[P00066 | 1545:1557 | NORMAL_TEXT | TABLE row=13 col=0]
postal_code

[P00067 | 1558:1563 | NORMAL_TEXT | TABLE row=13 col=1]
TEXT

[P00068 | 1564:1566 | NORMAL_TEXT | TABLE row=13 col=2]
—

[P00069 | 1567:1613 | NORMAL_TEXT | TABLE row=13 col=3]
Postal code portion of the address. Optional.

[P00070 | 1614:1943 | NORMAL_TEXT]
Table 32 describes the table in the database named profiles, where application profile, contact, address, account-status, and role information for authenticated users is stored. Authentication credentials are managed separately through Supabase Auth. The application roles are Owner/Admin, Operations Staff, and Customer/Renter.

[P00071 | 1943:1952 | NORMAL_TEXT]
Table 33

[P00072 | 1952:1979 | NORMAL_TEXT]
Data Dictionary – Branches

[P00073 | 1982:1993 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00074 | 1994:2004 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00075 | 2005:2016 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00076 | 2017:2029 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00077 | 2031:2034 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00078 | 2035:2040 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00079 | 2041:2050 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00080 | 2051:2108 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00081 | 2110:2115 | NORMAL_TEXT | TABLE row=2 col=0]
name

[P00082 | 2116:2121 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P00083 | 2122:2124 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P00084 | 2125:2188 | NORMAL_TEXT | TABLE row=2 col=3]
Name of the operational branch. Unique when present. Required.

[P00085 | 2190:2198 | NORMAL_TEXT | TABLE row=3 col=0]
address

[P00086 | 2199:2204 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00087 | 2205:2207 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00088 | 2208:2253 | NORMAL_TEXT | TABLE row=3 col=3]
Address of the operational branch. Optional.

[P00089 | 2255:2265 | NORMAL_TEXT | TABLE row=4 col=0]
is_active

[P00090 | 2266:2274 | NORMAL_TEXT | TABLE row=4 col=1]
BOOLEAN

[P00091 | 2275:2282 | NORMAL_TEXT | TABLE row=4 col=2]
1 byte

[P00092 | 2283:2333 | NORMAL_TEXT | TABLE row=4 col=3]
Indicates whether the record is active. Required.

[P00093 | 2335:2346 | NORMAL_TEXT | TABLE row=5 col=0]
created_at

[P00094 | 2347:2359 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P00095 | 2360:2368 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P00096 | 2369:2422 | NORMAL_TEXT | TABLE row=5 col=3]
Date and time when the record was created. Required.

[P00097 | 2424:2435 | NORMAL_TEXT | TABLE row=6 col=0]
updated_at

[P00098 | 2436:2448 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P00099 | 2449:2457 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P00100 | 2458:2513 | NORMAL_TEXT | TABLE row=6 col=3]
Date and time of the latest recorded update. Required.

[P00101 | 2514:2720 | NORMAL_TEXT]
Table 33 describes the table in the database named branches, where operational branch names, addresses, and active flags are maintained for fleet assignment, bookings, forecasting, and allocation planning.

[P00102 | 2720:2729 | NORMAL_TEXT]
Table 34

[P00103 | 2729:2766 | NORMAL_TEXT]
Data Dictionary – Vehicle Categories

[P00104 | 2766:2767 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00105 | 2770:2781 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00106 | 2782:2792 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00107 | 2793:2804 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00108 | 2805:2817 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00109 | 2819:2822 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00110 | 2823:2828 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00111 | 2829:2838 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00112 | 2839:2896 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00113 | 2898:2903 | NORMAL_TEXT | TABLE row=2 col=0]
name

[P00114 | 2904:2909 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P00115 | 2910:2912 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P00116 | 2913:2974 | NORMAL_TEXT | TABLE row=2 col=3]
Name of the vehicle category. Unique when present. Required.

[P00117 | 2976:2988 | NORMAL_TEXT | TABLE row=3 col=0]
description

[P00118 | 2989:2994 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00119 | 2995:2997 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00120 | 2998:3045 | NORMAL_TEXT | TABLE row=3 col=3]
Description of the vehicle category. Optional.

[P00121 | 3047:3057 | NORMAL_TEXT | TABLE row=4 col=0]
is_active

[P00122 | 3058:3066 | NORMAL_TEXT | TABLE row=4 col=1]
BOOLEAN

[P00123 | 3067:3074 | NORMAL_TEXT | TABLE row=4 col=2]
1 byte

[P00124 | 3075:3125 | NORMAL_TEXT | TABLE row=4 col=3]
Indicates whether the record is active. Required.

[P00125 | 3127:3138 | NORMAL_TEXT | TABLE row=5 col=0]
created_at

[P00126 | 3139:3151 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P00127 | 3152:3160 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P00128 | 3161:3214 | NORMAL_TEXT | TABLE row=5 col=3]
Date and time when the record was created. Required.

[P00129 | 3216:3227 | NORMAL_TEXT | TABLE row=6 col=0]
updated_at

[P00130 | 3228:3240 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P00131 | 3241:3249 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P00132 | 3250:3305 | NORMAL_TEXT | TABLE row=6 col=3]
Date and time of the latest recorded update. Required.

[P00133 | 3306:3504 | NORMAL_TEXT]
Table 34 describes the table in the database named vehicle_categories, where vehicle classifications and their descriptions are maintained for fleet organization and category-based demand planning.

[P00134 | 3504:3513 | NORMAL_TEXT]
Table 35

[P00135 | 3513:3540 | NORMAL_TEXT]
Data Dictionary – Vehicles

[P00136 | 3540:3541 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00137 | 3544:3555 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00138 | 3556:3566 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00139 | 3567:3578 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00140 | 3579:3591 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00141 | 3593:3596 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00142 | 3597:3602 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00143 | 3603:3612 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00144 | 3613:3670 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00145 | 3672:3677 | NORMAL_TEXT | TABLE row=2 col=0]
name

[P00146 | 3678:3683 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P00147 | 3684:3686 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P00148 | 3687:3746 | NORMAL_TEXT | TABLE row=2 col=3]
Vehicle name displayed in the fleet and catalog. Required.

[P00149 | 3748:3760 | NORMAL_TEXT | TABLE row=3 col=0]
category_id

[P00150 | 3761:3766 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00151 | 3767:3776 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00152 | 3777:3865 | NORMAL_TEXT | TABLE row=3 col=3]
Vehicle category assigned to the record. FK to public.vehicle_categories(id). Required.

[P00153 | 3867:3877 | NORMAL_TEXT | TABLE row=4 col=0]
branch_id

[P00154 | 3878:3883 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P00155 | 3884:3893 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P00156 | 3894:3978 | NORMAL_TEXT | TABLE row=4 col=3]
Operational branch associated with the record. FK to public.branches(id). Required.

[P00157 | 3980:3994 | NORMAL_TEXT | TABLE row=5 col=0]
license_plate

[P00158 | 3995:4000 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P00159 | 4001:4003 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P00160 | 4004:4085 | NORMAL_TEXT | TABLE row=5 col=3]
Vehicle registration plate; unique when supplied. Unique when present. Optional.

[P00161 | 4087:4100 | NORMAL_TEXT | TABLE row=6 col=0]
transmission

[P00162 | 4101:4106 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P00163 | 4107:4109 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00164 | 4110:4148 | NORMAL_TEXT | TABLE row=6 col=3]
Recorded transmission type. Optional.

[P00165 | 4150:4160 | NORMAL_TEXT | TABLE row=7 col=0]
fuel_type

[P00166 | 4161:4166 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P00167 | 4167:4169 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P00168 | 4170:4200 | NORMAL_TEXT | TABLE row=7 col=3]
Recorded fuel type. Optional.

[P00169 | 4202:4216 | NORMAL_TEXT | TABLE row=8 col=0]
seat_capacity

[P00170 | 4217:4225 | NORMAL_TEXT | TABLE row=8 col=1]
INTEGER

[P00171 | 4226:4234 | NORMAL_TEXT | TABLE row=8 col=2]
4 bytes

[P00172 | 4235:4297 | NORMAL_TEXT | TABLE row=8 col=3]
Passenger seating capacity; positive when supplied. Optional.

[P00173 | 4299:4310 | NORMAL_TEXT | TABLE row=9 col=0]
daily_rate

[P00174 | 4311:4325 | NORMAL_TEXT | TABLE row=9 col=1]
NUMERIC(12,2)

[P00175 | 4326:4348 | NORMAL_TEXT | TABLE row=9 col=2]
Precision 12, scale 2

[P00176 | 4349:4408 | NORMAL_TEXT | TABLE row=9 col=3]
Vehicle rental rate per day in Philippine pesos. Optional.

[P00177 | 4410:4449 | NORMAL_TEXT | TABLE row=10 col=0]
reference_fuel_efficiency_km_per_liter

[P00178 | 4450:4463 | NORMAL_TEXT | TABLE row=10 col=1]
NUMERIC(8,2)

[P00179 | 4464:4485 | NORMAL_TEXT | TABLE row=10 col=2]
Precision 8, scale 2

[P00180 | 4486:4609 | NORMAL_TEXT | TABLE row=10 col=3]
Reference fuel efficiency in kilometers per liter; positive when supplied and used for reference fuel estimates. Optional.

[P00181 | 4611:4621 | NORMAL_TEXT | TABLE row=11 col=0]
image_url

[P00182 | 4622:4627 | NORMAL_TEXT | TABLE row=11 col=1]
TEXT

[P00183 | 4628:4630 | NORMAL_TEXT | TABLE row=11 col=2]
—

[P00184 | 4631:4686 | NORMAL_TEXT | TABLE row=11 col=3]
Image reference associated with the vehicle. Optional.

[P00185 | 4688:4698 | NORMAL_TEXT | TABLE row=12 col=0]
is_active

[P00186 | 4699:4707 | NORMAL_TEXT | TABLE row=12 col=1]
BOOLEAN

[P00187 | 4708:4715 | NORMAL_TEXT | TABLE row=12 col=2]
1 byte

[P00188 | 4716:4766 | NORMAL_TEXT | TABLE row=12 col=3]
Indicates whether the record is active. Required.

[P00189 | 4768:4779 | NORMAL_TEXT | TABLE row=13 col=0]
created_at

[P00190 | 4780:4792 | NORMAL_TEXT | TABLE row=13 col=1]
TIMESTAMPTZ

[P00191 | 4793:4801 | NORMAL_TEXT | TABLE row=13 col=2]
8 bytes

[P00192 | 4802:4855 | NORMAL_TEXT | TABLE row=13 col=3]
Date and time when the record was created. Required.

[P00193 | 4857:4868 | NORMAL_TEXT | TABLE row=14 col=0]
updated_at

[P00194 | 4869:4881 | NORMAL_TEXT | TABLE row=14 col=1]
TIMESTAMPTZ

[P00195 | 4882:4890 | NORMAL_TEXT | TABLE row=14 col=2]
8 bytes

[P00196 | 4891:4946 | NORMAL_TEXT | TABLE row=14 col=3]
Date and time of the latest recorded update. Required.

[P00197 | 4948:4968 | NORMAL_TEXT | TABLE row=15 col=0]
current_odometer_km

[P00198 | 4969:4983 | NORMAL_TEXT | TABLE row=15 col=1]
NUMERIC(12,1)

[P00199 | 4984:5006 | NORMAL_TEXT | TABLE row=15 col=2]
Precision 12, scale 1

[P00200 | 5007:5065 | NORMAL_TEXT | TABLE row=15 col=3]
Latest recorded odometer reading in kilometers. Optional.

[P00201 | 5067:5095 | NORMAL_TEXT | TABLE row=16 col=0]
condition_blocks_rental_use

[P00202 | 5096:5104 | NORMAL_TEXT | TABLE row=16 col=1]
BOOLEAN

[P00203 | 5105:5112 | NORMAL_TEXT | TABLE row=16 col=2]
1 byte

[P00204 | 5113:5191 | NORMAL_TEXT | TABLE row=16 col=3]
Indicates whether the recorded vehicle condition blocks rental use. Required.

[P00205 | 5193:5216 | NORMAL_TEXT | TABLE row=17 col=0]
large_luggage_capacity

[P00206 | 5217:5225 | NORMAL_TEXT | TABLE row=17 col=1]
INTEGER

[P00207 | 5226:5234 | NORMAL_TEXT | TABLE row=17 col=2]
4 bytes

[P00208 | 5235:5317 | NORMAL_TEXT | TABLE row=17 col=3]
Recorded large-luggage capacity used in vehicle suitability assessment. Optional.

[P00209 | 5318:5695 | NORMAL_TEXT]
Table 35 describes the table in the database named vehicles, where vehicle specifications, branch assignment, category, reference rental rate, fuel efficiency, luggage capacity, and readiness-related information are maintained. Availability is assessed using operational records and conditions, including active rentals, confirmed bookings, maintenance, and vehicle condition.

[P00210 | 5695:5704 | NORMAL_TEXT]
Table 36

[P00211 | 5704:5737 | NORMAL_TEXT]
Data Dictionary – Vehicle Images

[P00212 | 5737:5738 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00213 | 5741:5752 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00214 | 5753:5763 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00215 | 5764:5775 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00216 | 5776:5788 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00217 | 5790:5793 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00218 | 5794:5799 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00219 | 5800:5809 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00220 | 5810:5867 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00221 | 5869:5880 | NORMAL_TEXT | TABLE row=2 col=0]
vehicle_id

[P00222 | 5881:5886 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00223 | 5887:5896 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00224 | 5897:5970 | NORMAL_TEXT | TABLE row=2 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P00225 | 5972:5985 | NORMAL_TEXT | TABLE row=3 col=0]
storage_path

[P00226 | 5986:5991 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00227 | 5992:5994 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00228 | 5995:6081 | NORMAL_TEXT | TABLE row=3 col=3]
Stored object reference identifying the uploaded file. Unique when present. Required.

[P00229 | 6083:6094 | NORMAL_TEXT | TABLE row=4 col=0]
public_url

[P00230 | 6095:6100 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P00231 | 6101:6103 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P00232 | 6104:6170 | NORMAL_TEXT | TABLE row=4 col=3]
Public image address used to display the gallery image. Required.

[P00233 | 6172:6181 | NORMAL_TEXT | TABLE row=5 col=0]
alt_text

[P00234 | 6182:6187 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P00235 | 6188:6190 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P00236 | 6191:6248 | NORMAL_TEXT | TABLE row=5 col=3]
Alternative text describing the vehicle image. Optional.

[P00237 | 6250:6261 | NORMAL_TEXT | TABLE row=6 col=0]
sort_order

[P00238 | 6262:6271 | NORMAL_TEXT | TABLE row=6 col=1]
SMALLINT

[P00239 | 6272:6280 | NORMAL_TEXT | TABLE row=6 col=2]
2 bytes

[P00240 | 6281:6348 | NORMAL_TEXT | TABLE row=6 col=3]
Gallery position from 0 to 4, unique within the vehicle. Required.

[P00241 | 6350:6359 | NORMAL_TEXT | TABLE row=7 col=0]
is_cover

[P00242 | 6360:6368 | NORMAL_TEXT | TABLE row=7 col=1]
BOOLEAN

[P00243 | 6369:6376 | NORMAL_TEXT | TABLE row=7 col=2]
1 byte

[P00244 | 6377:6470 | NORMAL_TEXT | TABLE row=7 col=3]
Indicates whether the image is the vehicle’s cover; at most one cover per vehicle. Required.

[P00245 | 6472:6483 | NORMAL_TEXT | TABLE row=8 col=0]
created_at

[P00246 | 6484:6496 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P00247 | 6497:6505 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P00248 | 6506:6559 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time when the record was created. Required.

[P00249 | 6560:6795 | NORMAL_TEXT]
Table 36 describes the table in the database named vehicle_images, where ordered vehicle-gallery images and the designated cover image are recorded. Each vehicle may have up to five ordered image positions and at most one cover image.

[P00250 | 6795:6804 | NORMAL_TEXT]
Table 37

[P00251 | 6804:6855 | NORMAL_TEXT]
Data Dictionary – Vehicle Operational State Events

[P00252 | 6855:6856 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00253 | 6859:6870 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00254 | 6871:6881 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00255 | 6882:6893 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00256 | 6894:6906 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00257 | 6908:6911 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00258 | 6912:6917 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00259 | 6918:6927 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00260 | 6928:6985 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00261 | 6987:6998 | NORMAL_TEXT | TABLE row=2 col=0]
vehicle_id

[P00262 | 6999:7004 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00263 | 7005:7014 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00264 | 7015:7088 | NORMAL_TEXT | TABLE row=2 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P00265 | 7090:7100 | NORMAL_TEXT | TABLE row=3 col=0]
is_active

[P00266 | 7101:7109 | NORMAL_TEXT | TABLE row=3 col=1]
BOOLEAN

[P00267 | 7110:7117 | NORMAL_TEXT | TABLE row=3 col=2]
1 byte

[P00268 | 7118:7173 | NORMAL_TEXT | TABLE row=3 col=3]
Vehicle active state recorded by this event. Required.

[P00269 | 7175:7188 | NORMAL_TEXT | TABLE row=4 col=0]
effective_at

[P00270 | 7189:7201 | NORMAL_TEXT | TABLE row=4 col=1]
TIMESTAMPTZ

[P00271 | 7202:7210 | NORMAL_TEXT | TABLE row=4 col=2]
8 bytes

[P00272 | 7211:7281 | NORMAL_TEXT | TABLE row=4 col=3]
Date and time from which the recorded active state applies. Required.

[P00273 | 7283:7295 | NORMAL_TEXT | TABLE row=5 col=0]
recorded_by

[P00274 | 7296:7301 | NORMAL_TEXT | TABLE row=5 col=1]
UUID

[P00275 | 7302:7311 | NORMAL_TEXT | TABLE row=5 col=2]
16 bytes

[P00276 | 7312:7400 | NORMAL_TEXT | TABLE row=5 col=3]
Authenticated user associated with the state recording. FK to auth.users(id). Optional.

[P00277 | 7402:7409 | NORMAL_TEXT | TABLE row=6 col=0]
source

[P00278 | 7410:7415 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P00279 | 7416:7418 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00280 | 7419:7492 | NORMAL_TEXT | TABLE row=6 col=3]
Origin label of the state event; defaults to vehicle_mutation. Required.

[P00281 | 7494:7505 | NORMAL_TEXT | TABLE row=7 col=0]
created_at

[P00282 | 7506:7518 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P00283 | 7519:7527 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P00284 | 7528:7581 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when the record was created. Required.

[P00285 | 7582:7874 | NORMAL_TEXT]
Table 37 describes the table in the database named vehicle_operational_state_events, where changes in a vehicle’s active state and their effective times are preserved. These events support historical operational-state interpretation rather than serving as a complete branch-transfer history.

[P00286 | 7874:7883 | NORMAL_TEXT]
Table 38

[P00287 | 7883:7918 | NORMAL_TEXT]
Data Dictionary – Booking Requests

[P00288 | 7918:7919 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00289 | 7922:7933 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00290 | 7934:7944 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00291 | 7945:7956 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00292 | 7957:7969 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00293 | 7971:7974 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00294 | 7975:7980 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00295 | 7981:7990 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00296 | 7991:8048 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00297 | 8050:8062 | NORMAL_TEXT | TABLE row=2 col=0]
customer_id

[P00298 | 8063:8068 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00299 | 8069:8078 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00300 | 8079:8153 | NORMAL_TEXT | TABLE row=2 col=3]
Customer associated with the record. FK to public.profiles(id). Required.

[P00301 | 8155:8176 | NORMAL_TEXT | TABLE row=3 col=0]
requested_vehicle_id

[P00302 | 8177:8182 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00303 | 8183:8192 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00304 | 8193:8275 | NORMAL_TEXT | TABLE row=3 col=3]
Vehicle initially requested by the customer. FK to public.vehicles(id). Required.

[P00305 | 8277:8297 | NORMAL_TEXT | TABLE row=4 col=0]
assigned_vehicle_id

[P00306 | 8298:8303 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P00307 | 8304:8313 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P00308 | 8314:8400 | NORMAL_TEXT | TABLE row=4 col=3]
Vehicle assigned for fulfillment of the booking. FK to public.vehicles(id). Optional.

[P00309 | 8402:8419 | NORMAL_TEXT | TABLE row=5 col=0]
pickup_branch_id

[P00310 | 8420:8425 | NORMAL_TEXT | TABLE row=5 col=1]
UUID

[P00311 | 8426:8435 | NORMAL_TEXT | TABLE row=5 col=2]
16 bytes

[P00312 | 8436:8513 | NORMAL_TEXT | TABLE row=5 col=3]
Operational branch recorded for pickup. FK to public.branches(id). Required.

[P00313 | 8515:8532 | NORMAL_TEXT | TABLE row=6 col=0]
return_branch_id

[P00314 | 8533:8538 | NORMAL_TEXT | TABLE row=6 col=1]
UUID

[P00315 | 8539:8548 | NORMAL_TEXT | TABLE row=6 col=2]
16 bytes

[P00316 | 8549:8626 | NORMAL_TEXT | TABLE row=6 col=3]
Operational branch recorded for return. FK to public.branches(id). Required.

[P00317 | 8628:8638 | NORMAL_TEXT | TABLE row=7 col=0]
pickup_at

[P00318 | 8639:8651 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P00319 | 8652:8660 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P00320 | 8661:8703 | NORMAL_TEXT | TABLE row=7 col=3]
Scheduled pickup date and time. Required.

[P00321 | 8705:8715 | NORMAL_TEXT | TABLE row=8 col=0]
return_at

[P00322 | 8716:8728 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P00323 | 8729:8737 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P00324 | 8738:8799 | NORMAL_TEXT | TABLE row=8 col=3]
Scheduled return date and time; later than pickup. Required.

[P00325 | 8801:8813 | NORMAL_TEXT | TABLE row=9 col=0]
destination

[P00326 | 8814:8819 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P00327 | 8820:8822 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P00328 | 8823:8877 | NORMAL_TEXT | TABLE row=9 col=3]
Destination entered for the planned rental. Optional.

[P00329 | 8879:8894 | NORMAL_TEXT | TABLE row=10 col=0]
purpose_of_use

[P00330 | 8895:8900 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P00331 | 8901:8903 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P00332 | 8904:8956 | NORMAL_TEXT | TABLE row=10 col=3]
Customer’s stated purpose for the rental. Required.

[P00333 | 8958:8981 | NORMAL_TEXT | TABLE row=11 col=0]
pickup_delivery_option

[P00334 | 8982:8987 | NORMAL_TEXT | TABLE row=11 col=1]
TEXT

[P00335 | 8988:8990 | NORMAL_TEXT | TABLE row=11 col=2]
—

[P00336 | 8991:9079 | NORMAL_TEXT | TABLE row=11 col=3]
Customer’s selection of pickup or delivery. Allowed values: pickup, delivery. Required.

[P00337 | 9081:9097 | NORMAL_TEXT | TABLE row=12 col=0]
pickup_location

[P00338 | 9098:9103 | NORMAL_TEXT | TABLE row=12 col=1]
TEXT

[P00339 | 9104:9106 | NORMAL_TEXT | TABLE row=12 col=2]
—

[P00340 | 9107:9172 | NORMAL_TEXT | TABLE row=12 col=3]
Delivery pickup address; absent for the pickup option. Optional.

[P00341 | 9174:9191 | NORMAL_TEXT | TABLE row=13 col=0]
dropoff_location

[P00342 | 9192:9197 | NORMAL_TEXT | TABLE row=13 col=1]
TEXT

[P00343 | 9198:9200 | NORMAL_TEXT | TABLE row=13 col=2]
—

[P00344 | 9201:9273 | NORMAL_TEXT | TABLE row=13 col=3]
Delivery drop-off address recorded when delivery is selected. Optional.

[P00345 | 9275:9296 | NORMAL_TEXT | TABLE row=14 col=0]
preferred_seat_count

[P00346 | 9297:9305 | NORMAL_TEXT | TABLE row=14 col=1]
INTEGER

[P00347 | 9306:9314 | NORMAL_TEXT | TABLE row=14 col=2]
4 bytes

[P00348 | 9315:9371 | NORMAL_TEXT | TABLE row=14 col=3]
Requested seat count; positive when supplied. Optional.

[P00349 | 9373:9397 | NORMAL_TEXT | TABLE row=15 col=0]
customer_contact_number

[P00350 | 9398:9403 | NORMAL_TEXT | TABLE row=15 col=1]
TEXT

[P00351 | 9404:9406 | NORMAL_TEXT | TABLE row=15 col=2]
—

[P00352 | 9407:9468 | NORMAL_TEXT | TABLE row=15 col=3]
Contact telephone number supplied for the booking. Optional.

[P00353 | 9470:9485 | NORMAL_TEXT | TABLE row=16 col=0]
booking_status

[P00354 | 9486:9491 | NORMAL_TEXT | TABLE row=16 col=1]
TEXT

[P00355 | 9492:9494 | NORMAL_TEXT | TABLE row=16 col=2]
—

[P00356 | 9495:9604 | NORMAL_TEXT | TABLE row=16 col=3]
Current booking lifecycle state. Allowed values: Draft, Submitted, Confirmed, Rejected, Cancelled. Required.

[P00357 | 9606:9617 | NORMAL_TEXT | TABLE row=17 col=0]
created_at

[P00358 | 9618:9630 | NORMAL_TEXT | TABLE row=17 col=1]
TIMESTAMPTZ

[P00359 | 9631:9639 | NORMAL_TEXT | TABLE row=17 col=2]
8 bytes

[P00360 | 9640:9693 | NORMAL_TEXT | TABLE row=17 col=3]
Date and time when the record was created. Required.

[P00361 | 9695:9706 | NORMAL_TEXT | TABLE row=18 col=0]
updated_at

[P00362 | 9707:9719 | NORMAL_TEXT | TABLE row=18 col=1]
TIMESTAMPTZ

[P00363 | 9720:9728 | NORMAL_TEXT | TABLE row=18 col=2]
8 bytes

[P00364 | 9729:9784 | NORMAL_TEXT | TABLE row=18 col=3]
Date and time of the latest recorded update. Required.

[P00365 | 9786:9798 | NORMAL_TEXT | TABLE row=19 col=0]
assigned_by

[P00366 | 9799:9804 | NORMAL_TEXT | TABLE row=19 col=1]
UUID

[P00367 | 9805:9814 | NORMAL_TEXT | TABLE row=19 col=2]
16 bytes

[P00368 | 9815:9894 | NORMAL_TEXT | TABLE row=19 col=3]
User who recorded the vehicle assignment. FK to public.profiles(id). Optional.

[P00369 | 9896:9908 | NORMAL_TEXT | TABLE row=20 col=0]
assigned_at

[P00370 | 9909:9921 | NORMAL_TEXT | TABLE row=20 col=1]
TIMESTAMPTZ

[P00371 | 9922:9930 | NORMAL_TEXT | TABLE row=20 col=2]
8 bytes

[P00372 | 9931:9997 | NORMAL_TEXT | TABLE row=20 col=3]
Date and time when the vehicle assignment was recorded. Optional.

[P00373 | 9999:10015 | NORMAL_TEXT | TABLE row=21 col=0]
assignment_note

[P00374 | 10016:10021 | NORMAL_TEXT | TABLE row=21 col=1]
TEXT

[P00375 | 10022:10024 | NORMAL_TEXT | TABLE row=21 col=2]
—

[P00376 | 10025:10139 | NORMAL_TEXT | TABLE row=21 col=3]
Explanation accompanying vehicle assignment or an acknowledged substitution or cross-branch assignment. Optional.

[P00377 | 10141:10167 | NORMAL_TEXT | TABLE row=22 col=0]
substitution_acknowledged

[P00378 | 10168:10176 | NORMAL_TEXT | TABLE row=22 col=1]
BOOLEAN

[P00379 | 10177:10184 | NORMAL_TEXT | TABLE row=22 col=2]
1 byte

[P00380 | 10185:10268 | NORMAL_TEXT | TABLE row=22 col=3]
Indicates whether replacement of the requested vehicle was acknowledged. Required.

[P00381 | 10270:10296 | NORMAL_TEXT | TABLE row=23 col=0]
cross_branch_acknowledged

[P00382 | 10297:10305 | NORMAL_TEXT | TABLE row=23 col=1]
BOOLEAN

[P00383 | 10306:10313 | NORMAL_TEXT | TABLE row=23 col=2]
1 byte

[P00384 | 10314:10391 | NORMAL_TEXT | TABLE row=23 col=3]
Indicates whether assignment from another branch was acknowledged. Required.

[P00385 | 10393:10406 | NORMAL_TEXT | TABLE row=24 col=0]
confirmed_by

[P00386 | 10407:10412 | NORMAL_TEXT | TABLE row=24 col=1]
UUID

[P00387 | 10413:10422 | NORMAL_TEXT | TABLE row=24 col=2]
16 bytes

[P00388 | 10423:10492 | NORMAL_TEXT | TABLE row=24 col=3]
User who confirmed the booking. FK to public.profiles(id). Optional.

[P00389 | 10494:10507 | NORMAL_TEXT | TABLE row=25 col=0]
confirmed_at

[P00390 | 10508:10520 | NORMAL_TEXT | TABLE row=25 col=1]
TIMESTAMPTZ

[P00391 | 10521:10529 | NORMAL_TEXT | TABLE row=25 col=2]
8 bytes

[P00392 | 10530:10594 | NORMAL_TEXT | TABLE row=25 col=3]
Date and time when booking confirmation was recorded. Optional.

[P00393 | 10596:10614 | NORMAL_TEXT | TABLE row=26 col=0]
resolution_reason

[P00394 | 10615:10620 | NORMAL_TEXT | TABLE row=26 col=1]
TEXT

[P00395 | 10621:10623 | NORMAL_TEXT | TABLE row=26 col=2]
—

[P00396 | 10624:10680 | NORMAL_TEXT | TABLE row=26 col=3]
Reason recorded for the booking’s resolution. Optional.

[P00397 | 10682:10694 | NORMAL_TEXT | TABLE row=27 col=0]
resolved_by

[P00398 | 10695:10700 | NORMAL_TEXT | TABLE row=27 col=1]
UUID

[P00399 | 10701:10710 | NORMAL_TEXT | TABLE row=27 col=2]
16 bytes

[P00400 | 10711:10790 | NORMAL_TEXT | TABLE row=27 col=3]
User who recorded the booking resolution. FK to public.profiles(id). Optional.

[P00401 | 10792:10804 | NORMAL_TEXT | TABLE row=28 col=0]
resolved_at

[P00402 | 10805:10817 | NORMAL_TEXT | TABLE row=28 col=1]
TIMESTAMPTZ

[P00403 | 10818:10826 | NORMAL_TEXT | TABLE row=28 col=2]
8 bytes

[P00404 | 10827:10878 | NORMAL_TEXT | TABLE row=28 col=3]
Date and time of the booking resolution. Optional.

[P00405 | 10880:10908 | NORMAL_TEXT | TABLE row=29 col=0]
confirmation_exception_code

[P00406 | 10909:10914 | NORMAL_TEXT | TABLE row=29 col=1]
TEXT

[P00407 | 10915:10917 | NORMAL_TEXT | TABLE row=29 col=2]
—

[P00408 | 10918:11267 | NORMAL_TEXT | TABLE row=29 col=3]
Classified condition preventing automatic confirmation after payment verification. Allowed values: assignment_required, vehicle_unavailable, vehicle_maintenance_unready, vehicle_conflict, stale_assignment, assignment_expectation_required, pickup_window_elapsed, substitution_ack_required, cross_branch_ack_required, booking_not_submitted. Optional.

[P00409 | 11269:11300 | NORMAL_TEXT | TABLE row=30 col=0]
confirmation_exception_message

[P00410 | 11301:11306 | NORMAL_TEXT | TABLE row=30 col=1]
TEXT

[P00411 | 11307:11309 | NORMAL_TEXT | TABLE row=30 col=2]
—

[P00412 | 11310:11393 | NORMAL_TEXT | TABLE row=30 col=3]
Readable explanation of the condition preventing automatic confirmation. Optional.

[P00413 | 11395:11421 | NORMAL_TEXT | TABLE row=31 col=0]
confirmation_exception_at

[P00414 | 11422:11434 | NORMAL_TEXT | TABLE row=31 col=1]
TIMESTAMPTZ

[P00415 | 11435:11443 | NORMAL_TEXT | TABLE row=31 col=2]
8 bytes

[P00416 | 11444:11514 | NORMAL_TEXT | TABLE row=31 col=3]
Date and time when the confirmation exception was recorded. Optional.

[P00417 | 11515:11825 | NORMAL_TEXT]
Table 38 describes the table in the database named booking_requests, where customer rental requests, requested and assigned vehicles, schedules, locations, assignment acknowledgements, booking decisions, and confirmation exceptions are recorded. Return and pickup branches refer to operational branch records.

[P00418 | 11825:11834 | NORMAL_TEXT]
Table 39

[P00419 | 11834:11875 | NORMAL_TEXT]
Data Dictionary – Booking Finder Context

[P00420 | 11875:11876 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00421 | 11879:11890 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00422 | 11891:11901 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00423 | 11902:11913 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00424 | 11914:11926 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00425 | 11928:11939 | NORMAL_TEXT | TABLE row=1 col=0]
booking_id

[P00426 | 11940:11945 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00427 | 11946:11955 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00428 | 11956:12050 | NORMAL_TEXT | TABLE row=1 col=3]
Booking associated with the record. Primary key. FK to public.booking_requests(id). Required.

[P00429 | 12052:12072 | NORMAL_TEXT | TABLE row=2 col=0]
selected_vehicle_id

[P00430 | 12073:12078 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00431 | 12079:12088 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00432 | 12089:12175 | NORMAL_TEXT | TABLE row=2 col=3]
Vehicle selected from the Finder recommendation. FK to public.vehicles(id). Required.

[P00433 | 12177:12193 | NORMAL_TEXT | TABLE row=3 col=0]
requested_start

[P00434 | 12194:12206 | NORMAL_TEXT | TABLE row=3 col=1]
TIMESTAMPTZ

[P00435 | 12207:12215 | NORMAL_TEXT | TABLE row=3 col=2]
8 bytes

[P00436 | 12216:12276 | NORMAL_TEXT | TABLE row=3 col=3]
Rental start date and time entered in the Finder. Required.

[P00437 | 12278:12292 | NORMAL_TEXT | TABLE row=4 col=0]
requested_end

[P00438 | 12293:12305 | NORMAL_TEXT | TABLE row=4 col=1]
TIMESTAMPTZ

[P00439 | 12306:12314 | NORMAL_TEXT | TABLE row=4 col=2]
8 bytes

[P00440 | 12315:12373 | NORMAL_TEXT | TABLE row=4 col=3]
Rental end date and time entered in the Finder. Required.

[P00441 | 12375:12391 | NORMAL_TEXT | TABLE row=5 col=0]
passenger_count

[P00442 | 12392:12400 | NORMAL_TEXT | TABLE row=5 col=1]
INTEGER

[P00443 | 12401:12409 | NORMAL_TEXT | TABLE row=5 col=2]
4 bytes

[P00444 | 12410:12468 | NORMAL_TEXT | TABLE row=5 col=3]
Positive passenger count entered in the Finder. Required.

[P00445 | 12470:12485 | NORMAL_TEXT | TABLE row=6 col=0]
maximum_budget

[P00446 | 12486:12494 | NORMAL_TEXT | TABLE row=6 col=1]
NUMERIC

[P00447 | 12495:12497 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00448 | 12498:12555 | NORMAL_TEXT | TABLE row=6 col=3]
Positive maximum budget entered in the Finder. Required.

[P00449 | 12557:12579 | NORMAL_TEXT | TABLE row=7 col=0]
preferred_category_id

[P00450 | 12580:12585 | NORMAL_TEXT | TABLE row=7 col=1]
UUID

[P00451 | 12586:12595 | NORMAL_TEXT | TABLE row=7 col=2]
16 bytes

[P00452 | 12596:12703 | NORMAL_TEXT | TABLE row=7 col=3]
Optional vehicle-category preference entered in the Finder. FK to public.vehicle_categories(id). Optional.

[P00453 | 12705:12717 | NORMAL_TEXT | TABLE row=8 col=0]
destination

[P00454 | 12718:12723 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P00455 | 12724:12726 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P00456 | 12727:12781 | NORMAL_TEXT | TABLE row=8 col=3]
Destination entered for the planned rental. Optional.

[P00457 | 12783:12803 | NORMAL_TEXT | TABLE row=9 col=0]
recommendation_rank

[P00458 | 12804:12812 | NORMAL_TEXT | TABLE row=9 col=1]
INTEGER

[P00459 | 12813:12821 | NORMAL_TEXT | TABLE row=9 col=2]
4 bytes

[P00460 | 12822:12905 | NORMAL_TEXT | TABLE row=9 col=3]
Positive position of the selected vehicle in the recommendation results. Required.

[P00461 | 12907:12923 | NORMAL_TEXT | TABLE row=10 col=0]
finder_baseline

[P00462 | 12924:12929 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P00463 | 12930:12932 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P00464 | 12933:13019 | NORMAL_TEXT | TABLE row=10 col=3]
Label identifying the Finder recommendation baseline used for this booking. Required.

[P00465 | 13021:13032 | NORMAL_TEXT | TABLE row=11 col=0]
created_at

[P00466 | 13033:13045 | NORMAL_TEXT | TABLE row=11 col=1]
TIMESTAMPTZ

[P00467 | 13046:13054 | NORMAL_TEXT | TABLE row=11 col=2]
8 bytes

[P00468 | 13055:13108 | NORMAL_TEXT | TABLE row=11 col=3]
Date and time when the record was created. Required.

[P00469 | 13110:13126 | NORMAL_TEXT | TABLE row=12 col=0]
large_bag_count

[P00470 | 13127:13135 | NORMAL_TEXT | TABLE row=12 col=1]
INTEGER

[P00471 | 13136:13144 | NORMAL_TEXT | TABLE row=12 col=2]
4 bytes

[P00472 | 13145:13202 | NORMAL_TEXT | TABLE row=12 col=3]
Requested number of large bags, when supplied. Optional.

[P00473 | 13203:13529 | NORMAL_TEXT]
Table 39 describes the table in the database named booking_finder_context, where the applicable customer inputs, selected vehicle, and recommendation provenance associated with a Finder-assisted booking are preserved. External weather, road, and route responses are retrieved when needed and temporarily cached by the server.

[P00474 | 13529:13538 | NORMAL_TEXT]
Table 40

[P00475 | 13538:13585 | NORMAL_TEXT]
Data Dictionary – Booking Creation Idempotency

[P00476 | 13585:13586 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00477 | 13589:13600 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00478 | 13601:13611 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00479 | 13612:13623 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00480 | 13624:13636 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00481 | 13638:13650 | NORMAL_TEXT | TABLE row=1 col=0]
customer_id

[P00482 | 13651:13656 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00483 | 13657:13666 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00484 | 13667:13807 | NORMAL_TEXT | TABLE row=1 col=3]
Customer associated with the record. Part of the composite primary key (customer_id, idempotency_key). FK to public.profiles(id). Required.

[P00485 | 13809:13825 | NORMAL_TEXT | TABLE row=2 col=0]
idempotency_key

[P00486 | 13826:13831 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00487 | 13832:13841 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00488 | 13842:13997 | NORMAL_TEXT | TABLE row=2 col=3]
Request identifier used to prevent duplicate processing of the same operation. Part of the composite primary key (customer_id, idempotency_key). Required.

[P00489 | 13999:14019 | NORMAL_TEXT | TABLE row=3 col=0]
request_fingerprint

[P00490 | 14020:14025 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00491 | 14026:14028 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00492 | 14029:14118 | NORMAL_TEXT | TABLE row=3 col=3]
64-character hexadecimal fingerprint used to compare retried booking requests. Required.

[P00493 | 14120:14131 | NORMAL_TEXT | TABLE row=4 col=0]
booking_id

[P00494 | 14132:14137 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P00495 | 14138:14147 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P00496 | 14148:14250 | NORMAL_TEXT | TABLE row=4 col=3]
Booking associated with the record. FK to public.booking_requests(id). Unique when present. Required.

[P00497 | 14252:14263 | NORMAL_TEXT | TABLE row=5 col=0]
created_at

[P00498 | 14264:14276 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P00499 | 14277:14285 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P00500 | 14286:14339 | NORMAL_TEXT | TABLE row=5 col=3]
Date and time when the record was created. Required.

[P00501 | 14340:14593 | NORMAL_TEXT]
Table 40 describes the table in the database named booking_creation_idempotency, where customer request identifiers and request fingerprints are associated with the created booking to prevent duplicate booking creation when the same request is retried.

[P00502 | 14593:14602 | NORMAL_TEXT]
Table 41

[P00503 | 14602:14644 | NORMAL_TEXT]
Data Dictionary – Renter Requirement Sets

[P00504 | 14644:14645 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00505 | 14648:14659 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00506 | 14660:14670 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00507 | 14671:14682 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00508 | 14683:14695 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00509 | 14697:14700 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00510 | 14701:14706 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00511 | 14707:14716 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00512 | 14717:14774 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00513 | 14776:14787 | NORMAL_TEXT | TABLE row=2 col=0]
booking_id

[P00514 | 14788:14793 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00515 | 14794:14803 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00516 | 14804:14906 | NORMAL_TEXT | TABLE row=2 col=3]
Booking associated with the record. FK to public.booking_requests(id). Unique when present. Required.

[P00517 | 14908:14920 | NORMAL_TEXT | TABLE row=3 col=0]
customer_id

[P00518 | 14921:14926 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00519 | 14927:14936 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00520 | 14937:15011 | NORMAL_TEXT | TABLE row=3 col=3]
Customer associated with the record. FK to public.profiles(id). Required.

[P00521 | 15013:15020 | NORMAL_TEXT | TABLE row=4 col=0]
status

[P00522 | 15021:15026 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P00523 | 15027:15029 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P00524 | 15030:15147 | NORMAL_TEXT | TABLE row=4 col=3]
Recorded state of the record. Allowed values: Not Submitted, Pending Review, Needs Resubmission, Verified. Required.

[P00525 | 15149:15162 | NORMAL_TEXT | TABLE row=5 col=0]
submitted_at

[P00526 | 15163:15175 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P00527 | 15176:15184 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P00528 | 15185:15243 | NORMAL_TEXT | TABLE row=5 col=3]
Date and time when the submission was recorded. Optional.

[P00529 | 15245:15256 | NORMAL_TEXT | TABLE row=6 col=0]
created_at

[P00530 | 15257:15269 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P00531 | 15270:15278 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P00532 | 15279:15332 | NORMAL_TEXT | TABLE row=6 col=3]
Date and time when the record was created. Required.

[P00533 | 15334:15345 | NORMAL_TEXT | TABLE row=7 col=0]
updated_at

[P00534 | 15346:15358 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P00535 | 15359:15367 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P00536 | 15368:15423 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time of the latest recorded update. Required.

[P00537 | 15424:15636 | NORMAL_TEXT]
Table 41 describes the table in the database named renter_requirement_sets, where the requirement submission and verification state for each booking is maintained. A booking can have at most one requirement set.

[P00538 | 15636:15645 | NORMAL_TEXT]
Table 42

[P00539 | 15645:15692 | NORMAL_TEXT]
Data Dictionary – Renter Requirement Documents

[P00540 | 15692:15693 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00541 | 15696:15707 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00542 | 15708:15718 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00543 | 15719:15730 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00544 | 15731:15743 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00545 | 15745:15748 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00546 | 15749:15754 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00547 | 15755:15764 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00548 | 15765:15822 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00549 | 15824:15843 | NORMAL_TEXT | TABLE row=2 col=0]
requirement_set_id

[P00550 | 15844:15849 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00551 | 15850:15859 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00552 | 15860:15958 | NORMAL_TEXT | TABLE row=2 col=3]
Requirement set to which this record belongs. FK to public.renter_requirement_sets(id). Required.

[P00553 | 15960:15971 | NORMAL_TEXT | TABLE row=3 col=0]
booking_id

[P00554 | 15972:15977 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00555 | 15978:15987 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00556 | 15988:16069 | NORMAL_TEXT | TABLE row=3 col=3]
Booking associated with the record. FK to public.booking_requests(id). Required.

[P00557 | 16071:16083 | NORMAL_TEXT | TABLE row=4 col=0]
customer_id

[P00558 | 16084:16089 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P00559 | 16090:16099 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P00560 | 16100:16174 | NORMAL_TEXT | TABLE row=4 col=3]
Customer associated with the record. FK to public.profiles(id). Required.

[P00561 | 16176:16193 | NORMAL_TEXT | TABLE row=5 col=0]
requirement_type

[P00562 | 16194:16199 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P00563 | 16200:16202 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P00564 | 16203:16347 | NORMAL_TEXT | TABLE row=5 col=3]
Category of the uploaded renter requirement. Allowed values: Valid Government ID, Driver's License, Proof of Billing, Selfie with ID. Required.

[P00565 | 16349:16362 | NORMAL_TEXT | TABLE row=6 col=0]
storage_path

[P00566 | 16363:16368 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P00567 | 16369:16371 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00568 | 16372:16458 | NORMAL_TEXT | TABLE row=6 col=3]
Stored object reference identifying the uploaded file. Unique when present. Required.

[P00569 | 16460:16478 | NORMAL_TEXT | TABLE row=7 col=0]
original_filename

[P00570 | 16479:16484 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P00571 | 16485:16487 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P00572 | 16488:16540 | NORMAL_TEXT | TABLE row=7 col=3]
Original filename provided during upload. Required.

[P00573 | 16542:16552 | NORMAL_TEXT | TABLE row=8 col=0]
mime_type

[P00574 | 16553:16558 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P00575 | 16559:16561 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P00576 | 16562:16648 | NORMAL_TEXT | TABLE row=8 col=3]
Media type of the uploaded file; image/jpeg, image/png, or application/pdf. Required.

[P00577 | 16650:16661 | NORMAL_TEXT | TABLE row=9 col=0]
size_bytes

[P00578 | 16662:16669 | NORMAL_TEXT | TABLE row=9 col=1]
BIGINT

[P00579 | 16670:16678 | NORMAL_TEXT | TABLE row=9 col=2]
8 bytes

[P00580 | 16679:16762 | NORMAL_TEXT | TABLE row=9 col=3]
Uploaded file size; greater than zero and no more than 10,485,760 bytes. Required.

[P00581 | 16764:16772 | NORMAL_TEXT | TABLE row=10 col=0]
version

[P00582 | 16773:16781 | NORMAL_TEXT | TABLE row=10 col=1]
INTEGER

[P00583 | 16782:16790 | NORMAL_TEXT | TABLE row=10 col=2]
4 bytes

[P00584 | 16791:16857 | NORMAL_TEXT | TABLE row=10 col=3]
Positive version number identifying this file revision. Required.

[P00585 | 16859:16870 | NORMAL_TEXT | TABLE row=11 col=0]
is_current

[P00586 | 16871:16879 | NORMAL_TEXT | TABLE row=11 col=1]
BOOLEAN

[P00587 | 16880:16887 | NORMAL_TEXT | TABLE row=11 col=2]
1 byte

[P00588 | 16888:16950 | NORMAL_TEXT | TABLE row=11 col=3]
Indicates whether this file is the current version. Required.

[P00589 | 16952:16964 | NORMAL_TEXT | TABLE row=12 col=0]
uploaded_at

[P00590 | 16965:16977 | NORMAL_TEXT | TABLE row=12 col=1]
TIMESTAMPTZ

[P00591 | 16978:16986 | NORMAL_TEXT | TABLE row=12 col=2]
8 bytes

[P00592 | 16987:17039 | NORMAL_TEXT | TABLE row=12 col=3]
Date and time when the file was uploaded. Required.

[P00593 | 17041:17055 | NORMAL_TEXT | TABLE row=13 col=0]
superseded_at

[P00594 | 17056:17068 | NORMAL_TEXT | TABLE row=13 col=1]
TIMESTAMPTZ

[P00595 | 17069:17077 | NORMAL_TEXT | TABLE row=13 col=2]
8 bytes

[P00596 | 17078:17148 | NORMAL_TEXT | TABLE row=13 col=3]
Date and time when a newer file version replaced this file. Optional.

[P00597 | 17149:17430 | NORMAL_TEXT]
Table 42 describes the table in the database named renter_requirement_documents, where uploaded requirement-file references, document categories, and replacement versions are maintained. Previous versions remain distinguishable from the current file for each requirement category.

[P00598 | 17430:17439 | NORMAL_TEXT]
Table 43

[P00599 | 17439:17484 | NORMAL_TEXT]
Data Dictionary – Renter Requirement Reviews

[P00600 | 17484:17485 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00601 | 17488:17499 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00602 | 17500:17510 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00603 | 17511:17522 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00604 | 17523:17535 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00605 | 17537:17540 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00606 | 17541:17546 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00607 | 17547:17556 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00608 | 17557:17614 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00609 | 17616:17635 | NORMAL_TEXT | TABLE row=2 col=0]
requirement_set_id

[P00610 | 17636:17641 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00611 | 17642:17651 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00612 | 17652:17750 | NORMAL_TEXT | TABLE row=2 col=3]
Requirement set to which this record belongs. FK to public.renter_requirement_sets(id). Required.

[P00613 | 17752:17764 | NORMAL_TEXT | TABLE row=3 col=0]
reviewer_id

[P00614 | 17765:17770 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00615 | 17771:17780 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00616 | 17781:17858 | NORMAL_TEXT | TABLE row=3 col=3]
User who performed the document review. FK to public.profiles(id). Required.

[P00617 | 17860:17886 | NORMAL_TEXT | TABLE row=4 col=0]
government_id_document_id

[P00618 | 17887:17892 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P00619 | 17893:17902 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P00620 | 17903:18004 | NORMAL_TEXT | TABLE row=4 col=3]
Government id file examined in this review. FK to public.renter_requirement_documents(id). Required.

[P00621 | 18006:18028 | NORMAL_TEXT | TABLE row=5 col=0]
government_id_version

[P00622 | 18029:18037 | NORMAL_TEXT | TABLE row=5 col=1]
INTEGER

[P00623 | 18038:18046 | NORMAL_TEXT | TABLE row=5 col=2]
4 bytes

[P00624 | 18047:18101 | NORMAL_TEXT | TABLE row=5 col=3]
Version of the government ID file examined. Required.

[P00625 | 18103:18125 | NORMAL_TEXT | TABLE row=6 col=0]
government_id_outcome

[P00626 | 18126:18131 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P00627 | 18132:18134 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00628 | 18135:18233 | NORMAL_TEXT | TABLE row=6 col=3]
Review outcome for the government ID file. Allowed values: Accepted, Needs Replacement. Required.

[P00629 | 18235:18256 | NORMAL_TEXT | TABLE row=7 col=0]
government_id_reason

[P00630 | 18257:18262 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P00631 | 18263:18265 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P00632 | 18266:18339 | NORMAL_TEXT | TABLE row=7 col=3]
Reason recorded when the government ID file needs replacement. Optional.

[P00633 | 18341:18369 | NORMAL_TEXT | TABLE row=8 col=0]
drivers_license_document_id

[P00634 | 18370:18375 | NORMAL_TEXT | TABLE row=8 col=1]
UUID

[P00635 | 18376:18385 | NORMAL_TEXT | TABLE row=8 col=2]
16 bytes

[P00636 | 18386:18490 | NORMAL_TEXT | TABLE row=8 col=3]
Driver’s license file examined in this review. FK to public.renter_requirement_documents(id). Required.

[P00637 | 18492:18516 | NORMAL_TEXT | TABLE row=9 col=0]
drivers_license_version

[P00638 | 18517:18525 | NORMAL_TEXT | TABLE row=9 col=1]
INTEGER

[P00639 | 18526:18534 | NORMAL_TEXT | TABLE row=9 col=2]
4 bytes

[P00640 | 18535:18592 | NORMAL_TEXT | TABLE row=9 col=3]
Version of the driver’s license file examined. Required.

[P00641 | 18594:18618 | NORMAL_TEXT | TABLE row=10 col=0]
drivers_license_outcome

[P00642 | 18619:18624 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P00643 | 18625:18627 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P00644 | 18628:18729 | NORMAL_TEXT | TABLE row=10 col=3]
Review outcome for the driver’s license file. Allowed values: Accepted, Needs Replacement. Required.

[P00645 | 18731:18754 | NORMAL_TEXT | TABLE row=11 col=0]
drivers_license_reason

[P00646 | 18755:18760 | NORMAL_TEXT | TABLE row=11 col=1]
TEXT

[P00647 | 18761:18763 | NORMAL_TEXT | TABLE row=11 col=2]
—

[P00648 | 18764:18840 | NORMAL_TEXT | TABLE row=11 col=3]
Reason recorded when the driver’s license file needs replacement. Optional.

[P00649 | 18842:18863 | NORMAL_TEXT | TABLE row=12 col=0]
identity_consistency

[P00650 | 18864:18869 | NORMAL_TEXT | TABLE row=12 col=1]
TEXT

[P00651 | 18870:18872 | NORMAL_TEXT | TABLE row=12 col=2]
—

[P00652 | 18873:18982 | NORMAL_TEXT | TABLE row=12 col=3]
Recorded consistency between the reviewed identity documents. Allowed values: Consistent, Concern. Required.

[P00653 | 18984:18996 | NORMAL_TEXT | TABLE row=13 col=0]
lto_outcome

[P00654 | 18997:19002 | NORMAL_TEXT | TABLE row=13 col=1]
TEXT

[P00655 | 19003:19005 | NORMAL_TEXT | TABLE row=13 col=2]
—

[P00656 | 19006:19189 | NORMAL_TEXT | TABLE row=13 col=3]
Retained license-check outcome; the current review endpoint records Not Checked and does not require an LTO check. Allowed values: Not Checked, Clear, Concern, Unavailable. Required.

[P00657 | 19191:19206 | NORMAL_TEXT | TABLE row=14 col=0]
lto_checked_at

[P00658 | 19207:19219 | NORMAL_TEXT | TABLE row=14 col=1]
TIMESTAMPTZ

[P00659 | 19220:19228 | NORMAL_TEXT | TABLE row=14 col=2]
8 bytes

[P00660 | 19229:19299 | NORMAL_TEXT | TABLE row=14 col=3]
Retained date and time of a recorded LTO check, if present. Optional.

[P00661 | 19301:19318 | NORMAL_TEXT | TABLE row=15 col=0]
resulting_status

[P00662 | 19319:19324 | NORMAL_TEXT | TABLE row=15 col=1]
TEXT

[P00663 | 19325:19327 | NORMAL_TEXT | TABLE row=15 col=2]
—

[P00664 | 19328:19449 | NORMAL_TEXT | TABLE row=15 col=3]
Requirement-set state resulting from the review. Allowed values: Pending Review, Needs Resubmission, Verified. Required.

[P00665 | 19451:19463 | NORMAL_TEXT | TABLE row=16 col=0]
reviewed_at

[P00666 | 19464:19476 | NORMAL_TEXT | TABLE row=16 col=1]
TIMESTAMPTZ

[P00667 | 19477:19485 | NORMAL_TEXT | TABLE row=16 col=2]
8 bytes

[P00668 | 19486:19540 | NORMAL_TEXT | TABLE row=16 col=3]
Date and time when the review was recorded. Required.

[P00669 | 19542:19571 | NORMAL_TEXT | TABLE row=17 col=0]
proof_of_billing_document_id

[P00670 | 19572:19577 | NORMAL_TEXT | TABLE row=17 col=1]
UUID

[P00671 | 19578:19587 | NORMAL_TEXT | TABLE row=17 col=2]
16 bytes

[P00672 | 19588:19692 | NORMAL_TEXT | TABLE row=17 col=3]
Proof of billing file examined in this review. FK to public.renter_requirement_documents(id). Optional.

[P00673 | 19694:19719 | NORMAL_TEXT | TABLE row=18 col=0]
proof_of_billing_version

[P00674 | 19720:19728 | NORMAL_TEXT | TABLE row=18 col=1]
INTEGER

[P00675 | 19729:19737 | NORMAL_TEXT | TABLE row=18 col=2]
4 bytes

[P00676 | 19738:19795 | NORMAL_TEXT | TABLE row=18 col=3]
Version of the proof of billing file examined. Optional.

[P00677 | 19797:19822 | NORMAL_TEXT | TABLE row=19 col=0]
proof_of_billing_outcome

[P00678 | 19823:19828 | NORMAL_TEXT | TABLE row=19 col=1]
TEXT

[P00679 | 19829:19831 | NORMAL_TEXT | TABLE row=19 col=2]
—

[P00680 | 19832:19933 | NORMAL_TEXT | TABLE row=19 col=3]
Review outcome for the proof of billing file. Allowed values: Accepted, Needs Replacement. Optional.

[P00681 | 19935:19959 | NORMAL_TEXT | TABLE row=20 col=0]
proof_of_billing_reason

[P00682 | 19960:19965 | NORMAL_TEXT | TABLE row=20 col=1]
TEXT

[P00683 | 19966:19968 | NORMAL_TEXT | TABLE row=20 col=2]
—

[P00684 | 19969:20045 | NORMAL_TEXT | TABLE row=20 col=3]
Reason recorded when the proof of billing file needs replacement. Optional.

[P00685 | 20047:20074 | NORMAL_TEXT | TABLE row=21 col=0]
selfie_with_id_document_id

[P00686 | 20075:20080 | NORMAL_TEXT | TABLE row=21 col=1]
UUID

[P00687 | 20081:20090 | NORMAL_TEXT | TABLE row=21 col=2]
16 bytes

[P00688 | 20091:20193 | NORMAL_TEXT | TABLE row=21 col=3]
Selfie with id file examined in this review. FK to public.renter_requirement_documents(id). Optional.

[P00689 | 20195:20218 | NORMAL_TEXT | TABLE row=22 col=0]
selfie_with_id_version

[P00690 | 20219:20227 | NORMAL_TEXT | TABLE row=22 col=1]
INTEGER

[P00691 | 20228:20236 | NORMAL_TEXT | TABLE row=22 col=2]
4 bytes

[P00692 | 20237:20292 | NORMAL_TEXT | TABLE row=22 col=3]
Version of the selfie with ID file examined. Optional.

[P00693 | 20294:20317 | NORMAL_TEXT | TABLE row=23 col=0]
selfie_with_id_outcome

[P00694 | 20318:20323 | NORMAL_TEXT | TABLE row=23 col=1]
TEXT

[P00695 | 20324:20326 | NORMAL_TEXT | TABLE row=23 col=2]
—

[P00696 | 20327:20426 | NORMAL_TEXT | TABLE row=23 col=3]
Review outcome for the selfie with ID file. Allowed values: Accepted, Needs Replacement. Optional.

[P00697 | 20428:20450 | NORMAL_TEXT | TABLE row=24 col=0]
selfie_with_id_reason

[P00698 | 20451:20456 | NORMAL_TEXT | TABLE row=24 col=1]
TEXT

[P00699 | 20457:20459 | NORMAL_TEXT | TABLE row=24 col=2]
—

[P00700 | 20460:20534 | NORMAL_TEXT | TABLE row=24 col=3]
Reason recorded when the selfie with ID file needs replacement. Optional.

[P00701 | 20535:20892 | NORMAL_TEXT]
Table 43 describes the table in the database named renter_requirement_reviews, where review decisions are recorded against the document versions examined, together with identity consistency and the resulting requirement-set status. The retained LTO outcome fields do not establish an automated license-verification integration or a current LTO review gate.

[P00702 | 20892:20901 | NORMAL_TEXT]
Table 44

[P00703 | 20901:20942 | NORMAL_TEXT]
Data Dictionary – Booking Payment Quotes

[P00704 | 20942:20943 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00705 | 20946:20957 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00706 | 20958:20968 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00707 | 20969:20980 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00708 | 20981:20993 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00709 | 20995:20998 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00710 | 20999:21004 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00711 | 21005:21014 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00712 | 21015:21072 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00713 | 21074:21085 | NORMAL_TEXT | TABLE row=2 col=0]
booking_id

[P00714 | 21086:21091 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00715 | 21092:21101 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00716 | 21102:21204 | NORMAL_TEXT | TABLE row=2 col=3]
Booking associated with the record. FK to public.booking_requests(id). Unique when present. Required.

[P00717 | 21206:21217 | NORMAL_TEXT | TABLE row=3 col=0]
vehicle_id

[P00718 | 21218:21223 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00719 | 21224:21233 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00720 | 21234:21307 | NORMAL_TEXT | TABLE row=3 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P00721 | 21309:21320 | NORMAL_TEXT | TABLE row=4 col=0]
daily_rate

[P00722 | 21321:21335 | NORMAL_TEXT | TABLE row=4 col=1]
NUMERIC(12,2)

[P00723 | 21336:21358 | NORMAL_TEXT | TABLE row=4 col=2]
Precision 12, scale 2

[P00724 | 21359:21418 | NORMAL_TEXT | TABLE row=4 col=3]
Vehicle rental rate per day in Philippine pesos. Required.

[P00725 | 21420:21430 | NORMAL_TEXT | TABLE row=5 col=0]
pickup_at

[P00726 | 21431:21443 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P00727 | 21444:21452 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P00728 | 21453:21495 | NORMAL_TEXT | TABLE row=5 col=3]
Scheduled pickup date and time. Required.

[P00729 | 21497:21507 | NORMAL_TEXT | TABLE row=6 col=0]
return_at

[P00730 | 21508:21520 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P00731 | 21521:21529 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P00732 | 21530:21591 | NORMAL_TEXT | TABLE row=6 col=3]
Scheduled return date and time; later than pickup. Required.

[P00733 | 21593:21607 | NORMAL_TEXT | TABLE row=7 col=0]
grace_minutes

[P00734 | 21608:21616 | NORMAL_TEXT | TABLE row=7 col=1]
INTEGER

[P00735 | 21617:21625 | NORMAL_TEXT | TABLE row=7 col=2]
4 bytes

[P00736 | 21626:21743 | NORMAL_TEXT | TABLE row=7 col=3]
Grace interval used when determining billable rental days; defaults to 60 minutes and is limited to 0–240. Required.

[P00737 | 21745:21759 | NORMAL_TEXT | TABLE row=8 col=0]
billable_days

[P00738 | 21760:21768 | NORMAL_TEXT | TABLE row=8 col=1]
INTEGER

[P00739 | 21769:21777 | NORMAL_TEXT | TABLE row=8 col=2]
4 bytes

[P00740 | 21778:21845 | NORMAL_TEXT | TABLE row=8 col=3]
Positive number of rental days charged by the quotation. Required.

[P00741 | 21847:21863 | NORMAL_TEXT | TABLE row=9 col=0]
rental_subtotal

[P00742 | 21864:21878 | NORMAL_TEXT | TABLE row=9 col=1]
NUMERIC(12,2)

[P00743 | 21879:21901 | NORMAL_TEXT | TABLE row=9 col=2]
Precision 12, scale 2

[P00744 | 21902:21966 | NORMAL_TEXT | TABLE row=9 col=3]
Positive vehicle-rental subtotal in Philippine pesos. Required.

[P00745 | 21968:21981 | NORMAL_TEXT | TABLE row=10 col=0]
delivery_fee

[P00746 | 21982:21996 | NORMAL_TEXT | TABLE row=10 col=1]
NUMERIC(12,2)

[P00747 | 21997:22019 | NORMAL_TEXT | TABLE row=10 col=2]
Precision 12, scale 2

[P00748 | 22020:22067 | NORMAL_TEXT | TABLE row=10 col=3]
Delivery charge in Philippine pesos. Required.

[P00749 | 22069:22082 | NORMAL_TEXT | TABLE row=11 col=0]
total_amount

[P00750 | 22083:22097 | NORMAL_TEXT | TABLE row=11 col=1]
NUMERIC(12,2)

[P00751 | 22098:22120 | NORMAL_TEXT | TABLE row=11 col=2]
Precision 12, scale 2

[P00752 | 22121:22186 | NORMAL_TEXT | TABLE row=11 col=3]
Rental subtotal plus delivery fee in Philippine pesos. Required.

[P00753 | 22188:22208 | NORMAL_TEXT | TABLE row=12 col=0]
down_payment_amount

[P00754 | 22209:22223 | NORMAL_TEXT | TABLE row=12 col=1]
NUMERIC(12,2)

[P00755 | 22224:22246 | NORMAL_TEXT | TABLE row=12 col=2]
Precision 12, scale 2

[P00756 | 22247:22352 | NORMAL_TEXT | TABLE row=12 col=3]
Required initial down payment, equal to 50 percent of the total rounded to two decimal places. Required.

[P00757 | 22354:22379 | NORMAL_TEXT | TABLE row=13 col=0]
remaining_balance_amount

[P00758 | 22380:22394 | NORMAL_TEXT | TABLE row=13 col=1]
NUMERIC(12,2)

[P00759 | 22395:22417 | NORMAL_TEXT | TABLE row=13 col=2]
Precision 12, scale 2

[P00760 | 22418:22477 | NORMAL_TEXT | TABLE row=13 col=3]
Total less the down payment in Philippine pesos. Required.

[P00761 | 22479:22503 | NORMAL_TEXT | TABLE row=14 col=0]
security_deposit_amount

[P00762 | 22504:22518 | NORMAL_TEXT | TABLE row=14 col=1]
NUMERIC(12,2)

[P00763 | 22519:22541 | NORMAL_TEXT | TABLE row=14 col=2]
Precision 12, scale 2

[P00764 | 22542:22610 | NORMAL_TEXT | TABLE row=14 col=3]
Separately recorded security deposit, fixed at PHP 3,000. Required.

[P00765 | 22612:22626 | NORMAL_TEXT | TABLE row=15 col=0]
quote_version

[P00766 | 22627:22635 | NORMAL_TEXT | TABLE row=15 col=1]
INTEGER

[P00767 | 22636:22644 | NORMAL_TEXT | TABLE row=15 col=2]
4 bytes

[P00768 | 22645:22698 | NORMAL_TEXT | TABLE row=15 col=3]
Positive revision number of the quotation. Required.

[P00769 | 22700:22710 | NORMAL_TEXT | TABLE row=16 col=0]
issued_by

[P00770 | 22711:22716 | NORMAL_TEXT | TABLE row=16 col=1]
UUID

[P00771 | 22717:22726 | NORMAL_TEXT | TABLE row=16 col=2]
16 bytes

[P00772 | 22727:22803 | NORMAL_TEXT | TABLE row=16 col=3]
User who issued the current quotation. FK to public.profiles(id). Required.

[P00773 | 22805:22815 | NORMAL_TEXT | TABLE row=17 col=0]
issued_at

[P00774 | 22816:22828 | NORMAL_TEXT | TABLE row=17 col=1]
TIMESTAMPTZ

[P00775 | 22829:22837 | NORMAL_TEXT | TABLE row=17 col=2]
8 bytes

[P00776 | 22838:22893 | NORMAL_TEXT | TABLE row=17 col=3]
Date and time when the quotation was issued. Required.

[P00777 | 22895:22906 | NORMAL_TEXT | TABLE row=18 col=0]
updated_at

[P00778 | 22907:22919 | NORMAL_TEXT | TABLE row=18 col=1]
TIMESTAMPTZ

[P00779 | 22920:22928 | NORMAL_TEXT | TABLE row=18 col=2]
8 bytes

[P00780 | 22929:22984 | NORMAL_TEXT | TABLE row=18 col=3]
Date and time of the latest recorded update. Required.

[P00781 | 22985:23320 | NORMAL_TEXT]
Table 44 describes the table in the database named booking_payment_quotes, where the current system-generated quotation for a booking is stored, including the vehicle’s daily rate, rental period, billable days, delivery fee, total amount, 50 percent down payment, remaining balance, and separately recorded PHP 3,000 security deposit.

[P00782 | 23320:23329 | NORMAL_TEXT]
Table 45

[P00783 | 23329:23363 | NORMAL_TEXT]
Data Dictionary – Payment Methods

[P00784 | 23363:23364 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00785 | 23367:23378 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00786 | 23379:23389 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00787 | 23390:23401 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00788 | 23402:23414 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00789 | 23416:23419 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00790 | 23420:23425 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00791 | 23426:23435 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00792 | 23436:23493 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00793 | 23495:23500 | NORMAL_TEXT | TABLE row=2 col=0]
code

[P00794 | 23501:23506 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P00795 | 23507:23509 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P00796 | 23510:23585 | NORMAL_TEXT | TABLE row=2 col=3]
Unique code identifying the payment method. Unique when present. Required.

[P00797 | 23587:23593 | NORMAL_TEXT | TABLE row=3 col=0]
label

[P00798 | 23594:23599 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00799 | 23600:23602 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00800 | 23603:23643 | NORMAL_TEXT | TABLE row=3 col=3]
Readable payment-method name. Required.

[P00801 | 23645:23658 | NORMAL_TEXT | TABLE row=4 col=0]
instructions

[P00802 | 23659:23664 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P00803 | 23665:23667 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P00804 | 23668:23726 | NORMAL_TEXT | TABLE row=4 col=3]
Payment instructions presented to the customer. Required.

[P00805 | 23728:23736 | NORMAL_TEXT | TABLE row=5 col=0]
is_demo

[P00806 | 23737:23745 | NORMAL_TEXT | TABLE row=5 col=1]
BOOLEAN

[P00807 | 23746:23753 | NORMAL_TEXT | TABLE row=5 col=2]
1 byte

[P00808 | 23754:23834 | NORMAL_TEXT | TABLE row=5 col=3]
Indicates whether the method is designated as a demonstration method. Required.

[P00809 | 23836:23846 | NORMAL_TEXT | TABLE row=6 col=0]
is_active

[P00810 | 23847:23855 | NORMAL_TEXT | TABLE row=6 col=1]
BOOLEAN

[P00811 | 23856:23863 | NORMAL_TEXT | TABLE row=6 col=2]
1 byte

[P00812 | 23864:23914 | NORMAL_TEXT | TABLE row=6 col=3]
Indicates whether the record is active. Required.

[P00813 | 23916:23927 | NORMAL_TEXT | TABLE row=7 col=0]
created_at

[P00814 | 23928:23940 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P00815 | 23941:23949 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P00816 | 23950:24003 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when the record was created. Required.

[P00817 | 24005:24020 | NORMAL_TEXT | TABLE row=8 col=0]
recipient_name

[P00818 | 24021:24026 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P00819 | 24027:24029 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P00820 | 24030:24071 | NORMAL_TEXT | TABLE row=8 col=3]
Name of the payment recipient. Optional.

[P00821 | 24073:24088 | NORMAL_TEXT | TABLE row=9 col=0]
account_number

[P00822 | 24089:24094 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P00823 | 24095:24097 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P00824 | 24098:24147 | NORMAL_TEXT | TABLE row=9 col=3]
Recipient’s payment-account reference. Optional.

[P00825 | 24149:24163 | NORMAL_TEXT | TABLE row=10 col=0]
qr_image_path

[P00826 | 24164:24169 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P00827 | 24170:24172 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P00828 | 24173:24231 | NORMAL_TEXT | TABLE row=10 col=3]
Stored reference to the method’s QR-code image. Optional.

[P00829 | 24232:24435 | NORMAL_TEXT]
Table 45 describes the table in the database named payment_methods, where available payment-channel instructions, recipient details, account information, and optional QR-image references are maintained.

[P00830 | 24435:24444 | NORMAL_TEXT]
Table 46

[P00831 | 24444:24471 | NORMAL_TEXT]
Data Dictionary – Payments

[P00832 | 24471:24472 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00833 | 24475:24486 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00834 | 24487:24497 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00835 | 24498:24509 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00836 | 24510:24522 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00837 | 24524:24527 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00838 | 24528:24533 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00839 | 24534:24543 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00840 | 24544:24601 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00841 | 24603:24614 | NORMAL_TEXT | TABLE row=2 col=0]
booking_id

[P00842 | 24615:24620 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00843 | 24621:24630 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00844 | 24631:24733 | NORMAL_TEXT | TABLE row=2 col=3]
Booking associated with the record. FK to public.booking_requests(id). Unique when present. Required.

[P00845 | 24735:24747 | NORMAL_TEXT | TABLE row=3 col=0]
customer_id

[P00846 | 24748:24753 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00847 | 24754:24763 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00848 | 24764:24838 | NORMAL_TEXT | TABLE row=3 col=3]
Customer associated with the record. FK to public.profiles(id). Required.

[P00849 | 24840:24848 | NORMAL_TEXT | TABLE row=4 col=0]
purpose

[P00850 | 24849:24854 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P00851 | 24855:24857 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P00852 | 24858:24921 | NORMAL_TEXT | TABLE row=4 col=3]
Payment purpose, restricted to initial_down_payment. Required.

[P00853 | 24923:24932 | NORMAL_TEXT | TABLE row=5 col=0]
currency

[P00854 | 24933:24938 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P00855 | 24939:24941 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P00856 | 24942:24986 | NORMAL_TEXT | TABLE row=5 col=3]
Currency code, restricted to PHP. Required.

[P00857 | 24988:25004 | NORMAL_TEXT | TABLE row=6 col=0]
required_amount

[P00858 | 25005:25019 | NORMAL_TEXT | TABLE row=6 col=1]
NUMERIC(12,2)

[P00859 | 25020:25042 | NORMAL_TEXT | TABLE row=6 col=2]
Precision 12, scale 2

[P00860 | 25043:25104 | NORMAL_TEXT | TABLE row=6 col=3]
Required initial down payment in Philippine pesos. Optional.

[P00861 | 25106:25123 | NORMAL_TEXT | TABLE row=7 col=0]
submitted_amount

[P00862 | 25124:25138 | NORMAL_TEXT | TABLE row=7 col=1]
NUMERIC(12,2)

[P00863 | 25139:25161 | NORMAL_TEXT | TABLE row=7 col=2]
Precision 12, scale 2

[P00864 | 25162:25226 | NORMAL_TEXT | TABLE row=7 col=3]
Amount submitted by the customer in Philippine pesos. Optional.

[P00865 | 25228:25246 | NORMAL_TEXT | TABLE row=8 col=0]
payment_method_id

[P00866 | 25247:25252 | NORMAL_TEXT | TABLE row=8 col=1]
UUID

[P00867 | 25253:25262 | NORMAL_TEXT | TABLE row=8 col=2]
16 bytes

[P00868 | 25263:25347 | NORMAL_TEXT | TABLE row=8 col=3]
Selected payment method, when recorded. FK to public.payment_methods(id). Optional.

[P00869 | 25349:25370 | NORMAL_TEXT | TABLE row=9 col=0]
payment_method_label

[P00870 | 25371:25376 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P00871 | 25377:25379 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P00872 | 25380:25421 | NORMAL_TEXT | TABLE row=9 col=3]
Recorded payment-method label. Optional.

[P00873 | 25423:25445 | NORMAL_TEXT | TABLE row=10 col=0]
transaction_reference

[P00874 | 25446:25451 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P00875 | 25452:25454 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P00876 | 25455:25521 | NORMAL_TEXT | TABLE row=10 col=3]
Payment transaction reference supplied by the customer. Optional.

[P00877 | 25523:25530 | NORMAL_TEXT | TABLE row=11 col=0]
status

[P00878 | 25531:25536 | NORMAL_TEXT | TABLE row=11 col=1]
TEXT

[P00879 | 25537:25539 | NORMAL_TEXT | TABLE row=11 col=2]
—

[P00880 | 25540:25663 | NORMAL_TEXT | TABLE row=11 col=3]
Recorded state of the record. Allowed values: Not Submitted, Pending Verification, Needs Resubmission, Verified. Required.

[P00881 | 25665:25685 | NORMAL_TEXT | TABLE row=12 col=0]
resubmission_reason

[P00882 | 25686:25691 | NORMAL_TEXT | TABLE row=12 col=1]
TEXT

[P00883 | 25692:25694 | NORMAL_TEXT | TABLE row=12 col=2]
—

[P00884 | 25695:25775 | NORMAL_TEXT | TABLE row=12 col=3]
Reason requiring replacement or correction of the payment submission. Optional.

[P00885 | 25777:25789 | NORMAL_TEXT | TABLE row=13 col=0]
reviewed_by

[P00886 | 25790:25795 | NORMAL_TEXT | TABLE row=13 col=1]
UUID

[P00887 | 25796:25805 | NORMAL_TEXT | TABLE row=13 col=2]
16 bytes

[P00888 | 25806:25877 | NORMAL_TEXT | TABLE row=13 col=3]
User who reviewed the submission. FK to public.profiles(id). Optional.

[P00889 | 25879:25891 | NORMAL_TEXT | TABLE row=14 col=0]
reviewed_at

[P00890 | 25892:25904 | NORMAL_TEXT | TABLE row=14 col=1]
TIMESTAMPTZ

[P00891 | 25905:25913 | NORMAL_TEXT | TABLE row=14 col=2]
8 bytes

[P00892 | 25914:25968 | NORMAL_TEXT | TABLE row=14 col=3]
Date and time when the review was recorded. Optional.

[P00893 | 25970:25993 | NORMAL_TEXT | TABLE row=15 col=0]
reviewed_proof_version

[P00894 | 25994:26002 | NORMAL_TEXT | TABLE row=15 col=1]
INTEGER

[P00895 | 26003:26011 | NORMAL_TEXT | TABLE row=15 col=2]
4 bytes

[P00896 | 26012:26073 | NORMAL_TEXT | TABLE row=15 col=3]
Proof revision examined during the payment review. Optional.

[P00897 | 26075:26101 | NORMAL_TEXT | TABLE row=16 col=0]
reviewed_submitted_amount

[P00898 | 26102:26116 | NORMAL_TEXT | TABLE row=16 col=1]
NUMERIC(12,2)

[P00899 | 26117:26139 | NORMAL_TEXT | TABLE row=16 col=2]
Precision 12, scale 2

[P00900 | 26140:26203 | NORMAL_TEXT | TABLE row=16 col=3]
Submitted amount preserved with the review decision. Optional.

[P00901 | 26205:26236 | NORMAL_TEXT | TABLE row=17 col=0]
reviewed_transaction_reference

[P00902 | 26237:26242 | NORMAL_TEXT | TABLE row=17 col=1]
TEXT

[P00903 | 26243:26245 | NORMAL_TEXT | TABLE row=17 col=2]
—

[P00904 | 26246:26314 | NORMAL_TEXT | TABLE row=17 col=3]
Transaction reference preserved with the review decision. Optional.

[P00905 | 26316:26329 | NORMAL_TEXT | TABLE row=18 col=0]
submitted_at

[P00906 | 26330:26342 | NORMAL_TEXT | TABLE row=18 col=1]
TIMESTAMPTZ

[P00907 | 26343:26351 | NORMAL_TEXT | TABLE row=18 col=2]
8 bytes

[P00908 | 26352:26410 | NORMAL_TEXT | TABLE row=18 col=3]
Date and time when the submission was recorded. Optional.

[P00909 | 26412:26423 | NORMAL_TEXT | TABLE row=19 col=0]
created_at

[P00910 | 26424:26436 | NORMAL_TEXT | TABLE row=19 col=1]
TIMESTAMPTZ

[P00911 | 26437:26445 | NORMAL_TEXT | TABLE row=19 col=2]
8 bytes

[P00912 | 26446:26499 | NORMAL_TEXT | TABLE row=19 col=3]
Date and time when the record was created. Required.

[P00913 | 26501:26512 | NORMAL_TEXT | TABLE row=20 col=0]
updated_at

[P00914 | 26513:26525 | NORMAL_TEXT | TABLE row=20 col=1]
TIMESTAMPTZ

[P00915 | 26526:26534 | NORMAL_TEXT | TABLE row=20 col=2]
8 bytes

[P00916 | 26535:26590 | NORMAL_TEXT | TABLE row=20 col=3]
Date and time of the latest recorded update. Required.

[P00917 | 26591:26850 | NORMAL_TEXT]
Table 46 describes the table in the database named payments, where the initial down-payment requirement, submitted payment information, review evidence, and verification status for each booking are stored. The record is associated with versioned proof files.

[P00918 | 26850:26859 | NORMAL_TEXT]
Table 47

[P00919 | 26859:26892 | NORMAL_TEXT]
Data Dictionary – Payment Proofs

[P00920 | 26892:26893 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00921 | 26896:26907 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00922 | 26908:26918 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00923 | 26919:26930 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00924 | 26931:26943 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00925 | 26945:26948 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00926 | 26949:26954 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00927 | 26955:26964 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00928 | 26965:27022 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00929 | 27024:27035 | NORMAL_TEXT | TABLE row=2 col=0]
payment_id

[P00930 | 27036:27041 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00931 | 27042:27051 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00932 | 27052:27125 | NORMAL_TEXT | TABLE row=2 col=3]
Payment to which the proof belongs. FK to public.payments(id). Required.

[P00933 | 27127:27138 | NORMAL_TEXT | TABLE row=3 col=0]
booking_id

[P00934 | 27139:27144 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P00935 | 27145:27154 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P00936 | 27155:27236 | NORMAL_TEXT | TABLE row=3 col=3]
Booking associated with the record. FK to public.booking_requests(id). Required.

[P00937 | 27238:27250 | NORMAL_TEXT | TABLE row=4 col=0]
customer_id

[P00938 | 27251:27256 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P00939 | 27257:27266 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P00940 | 27267:27341 | NORMAL_TEXT | TABLE row=4 col=3]
Customer associated with the record. FK to public.profiles(id). Required.

[P00941 | 27343:27356 | NORMAL_TEXT | TABLE row=5 col=0]
storage_path

[P00942 | 27357:27362 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P00943 | 27363:27365 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P00944 | 27366:27452 | NORMAL_TEXT | TABLE row=5 col=3]
Stored object reference identifying the uploaded file. Unique when present. Required.

[P00945 | 27454:27472 | NORMAL_TEXT | TABLE row=6 col=0]
original_filename

[P00946 | 27473:27478 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P00947 | 27479:27481 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P00948 | 27482:27534 | NORMAL_TEXT | TABLE row=6 col=3]
Original filename provided during upload. Required.

[P00949 | 27536:27546 | NORMAL_TEXT | TABLE row=7 col=0]
mime_type

[P00950 | 27547:27552 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P00951 | 27553:27555 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P00952 | 27556:27642 | NORMAL_TEXT | TABLE row=7 col=3]
Media type of the uploaded file; image/jpeg, image/png, or application/pdf. Required.

[P00953 | 27644:27655 | NORMAL_TEXT | TABLE row=8 col=0]
size_bytes

[P00954 | 27656:27663 | NORMAL_TEXT | TABLE row=8 col=1]
BIGINT

[P00955 | 27664:27672 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P00956 | 27673:27757 | NORMAL_TEXT | TABLE row=8 col=3]
Uploaded proof size; greater than zero and no more than 10,485,760 bytes. Required.

[P00957 | 27759:27767 | NORMAL_TEXT | TABLE row=9 col=0]
version

[P00958 | 27768:27776 | NORMAL_TEXT | TABLE row=9 col=1]
INTEGER

[P00959 | 27777:27785 | NORMAL_TEXT | TABLE row=9 col=2]
4 bytes

[P00960 | 27786:27852 | NORMAL_TEXT | TABLE row=9 col=3]
Positive version number identifying this file revision. Required.

[P00961 | 27854:27865 | NORMAL_TEXT | TABLE row=10 col=0]
is_current

[P00962 | 27866:27874 | NORMAL_TEXT | TABLE row=10 col=1]
BOOLEAN

[P00963 | 27875:27882 | NORMAL_TEXT | TABLE row=10 col=2]
1 byte

[P00964 | 27883:27945 | NORMAL_TEXT | TABLE row=10 col=3]
Indicates whether this file is the current version. Required.

[P00965 | 27947:27959 | NORMAL_TEXT | TABLE row=11 col=0]
uploaded_at

[P00966 | 27960:27972 | NORMAL_TEXT | TABLE row=11 col=1]
TIMESTAMPTZ

[P00967 | 27973:27981 | NORMAL_TEXT | TABLE row=11 col=2]
8 bytes

[P00968 | 27982:28034 | NORMAL_TEXT | TABLE row=11 col=3]
Date and time when the file was uploaded. Required.

[P00969 | 28036:28050 | NORMAL_TEXT | TABLE row=12 col=0]
superseded_at

[P00970 | 28051:28063 | NORMAL_TEXT | TABLE row=12 col=1]
TIMESTAMPTZ

[P00971 | 28064:28072 | NORMAL_TEXT | TABLE row=12 col=2]
8 bytes

[P00972 | 28073:28143 | NORMAL_TEXT | TABLE row=12 col=3]
Date and time when a newer file version replaced this file. Optional.

[P00973 | 28144:28354 | NORMAL_TEXT]
Table 47 describes the table in the database named payment_proofs, where payment evidence-file references and their replacement versions are preserved. Each payment has at most one proof designated as current.

[P00974 | 28354:28363 | NORMAL_TEXT]
Table 48

[P00975 | 28363:28392 | NORMAL_TEXT]
Data Dictionary – Rate Cards

[P00976 | 28392:28393 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00977 | 28396:28407 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P00978 | 28408:28418 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P00979 | 28419:28430 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P00980 | 28431:28443 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P00981 | 28445:28448 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P00982 | 28449:28454 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P00983 | 28455:28464 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P00984 | 28465:28522 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P00985 | 28524:28535 | NORMAL_TEXT | TABLE row=2 col=0]
vehicle_id

[P00986 | 28536:28541 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P00987 | 28542:28551 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P00988 | 28552:28625 | NORMAL_TEXT | TABLE row=2 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P00989 | 28627:28640 | NORMAL_TEXT | TABLE row=3 col=0]
package_code

[P00990 | 28641:28646 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P00991 | 28647:28649 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P00992 | 28650:28706 | NORMAL_TEXT | TABLE row=3 col=3]
Code identifying the retained rental package. Required.

[P00993 | 28708:28722 | NORMAL_TEXT | TABLE row=4 col=0]
package_label

[P00994 | 28723:28728 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P00995 | 28729:28731 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P00996 | 28732:28788 | NORMAL_TEXT | TABLE row=4 col=3]
Readable name of the retained rental package. Required.

[P00997 | 28790:28805 | NORMAL_TEXT | TABLE row=5 col=0]
duration_hours

[P00998 | 28806:28814 | NORMAL_TEXT | TABLE row=5 col=1]
INTEGER

[P00999 | 28815:28823 | NORMAL_TEXT | TABLE row=5 col=2]
4 bytes

[P01000 | 28824:28868 | NORMAL_TEXT | TABLE row=5 col=3]
Rental-package duration in hours. Required.

[P01001 | 28870:28880 | NORMAL_TEXT | TABLE row=6 col=0]
base_rate

[P01002 | 28881:28895 | NORMAL_TEXT | TABLE row=6 col=1]
NUMERIC(12,2)

[P01003 | 28896:28918 | NORMAL_TEXT | TABLE row=6 col=2]
Precision 12, scale 2

[P01004 | 28919:28977 | NORMAL_TEXT | TABLE row=6 col=3]
Positive base package rate in Philippine pesos. Required.

[P01005 | 28979:28994 | NORMAL_TEXT | TABLE row=7 col=0]
effective_from

[P01006 | 28995:29000 | NORMAL_TEXT | TABLE row=7 col=1]
DATE

[P01007 | 29001:29009 | NORMAL_TEXT | TABLE row=7 col=2]
4 bytes

[P01008 | 29010:29068 | NORMAL_TEXT | TABLE row=7 col=3]
Beginning date of the retained rate’s validity. Required.

[P01009 | 29070:29086 | NORMAL_TEXT | TABLE row=8 col=0]
effective_until

[P01010 | 29087:29092 | NORMAL_TEXT | TABLE row=8 col=1]
DATE

[P01011 | 29093:29101 | NORMAL_TEXT | TABLE row=8 col=2]
4 bytes

[P01012 | 29102:29163 | NORMAL_TEXT | TABLE row=8 col=3]
Optional end date of the retained rate’s validity. Optional.

[P01013 | 29165:29175 | NORMAL_TEXT | TABLE row=9 col=0]
is_active

[P01014 | 29176:29184 | NORMAL_TEXT | TABLE row=9 col=1]
BOOLEAN

[P01015 | 29185:29192 | NORMAL_TEXT | TABLE row=9 col=2]
1 byte

[P01016 | 29193:29243 | NORMAL_TEXT | TABLE row=9 col=3]
Indicates whether the record is active. Required.

[P01017 | 29245:29265 | NORMAL_TEXT | TABLE row=10 col=0]
researcher_designed

[P01018 | 29266:29274 | NORMAL_TEXT | TABLE row=10 col=1]
BOOLEAN

[P01019 | 29275:29282 | NORMAL_TEXT | TABLE row=10 col=2]
1 byte

[P01020 | 29283:29380 | NORMAL_TEXT | TABLE row=10 col=3]
Identifies the retained structure as based on the researcher-designed quotation model. Required.

[P01021 | 29382:29393 | NORMAL_TEXT | TABLE row=11 col=0]
created_by

[P01022 | 29394:29399 | NORMAL_TEXT | TABLE row=11 col=1]
UUID

[P01023 | 29400:29409 | NORMAL_TEXT | TABLE row=11 col=2]
16 bytes

[P01024 | 29410:29476 | NORMAL_TEXT | TABLE row=11 col=3]
User who created the record. FK to public.profiles(id). Required.

[P01025 | 29478:29489 | NORMAL_TEXT | TABLE row=12 col=0]
created_at

[P01026 | 29490:29502 | NORMAL_TEXT | TABLE row=12 col=1]
TIMESTAMPTZ

[P01027 | 29503:29511 | NORMAL_TEXT | TABLE row=12 col=2]
8 bytes

[P01028 | 29512:29565 | NORMAL_TEXT | TABLE row=12 col=3]
Date and time when the record was created. Required.

[P01029 | 29567:29578 | NORMAL_TEXT | TABLE row=13 col=0]
updated_at

[P01030 | 29579:29591 | NORMAL_TEXT | TABLE row=13 col=1]
TIMESTAMPTZ

[P01031 | 29592:29600 | NORMAL_TEXT | TABLE row=13 col=2]
8 bytes

[P01032 | 29601:29656 | NORMAL_TEXT | TABLE row=13 col=3]
Date and time of the latest recorded update. Required.

[P01033 | 29657:29988 | NORMAL_TEXT]
Table 48 describes the table in the database named rate_cards, where versioned vehicle-package rates, effective dates, and researcher-designed indicators are stored as retained earlier structures. These records remain part of the physical database, while booking_payment_quotes supports the current quotation and payment workflow.

[P01034 | 29988:29997 | NORMAL_TEXT]
Table 49

[P01035 | 29997:30035 | NORMAL_TEXT]
Data Dictionary – Booking Rate Quotes

[P01036 | 30035:30036 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01037 | 30039:30050 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01038 | 30051:30061 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01039 | 30062:30073 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01040 | 30074:30086 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01041 | 30088:30091 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01042 | 30092:30097 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01043 | 30098:30107 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01044 | 30108:30165 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01045 | 30167:30178 | NORMAL_TEXT | TABLE row=2 col=0]
booking_id

[P01046 | 30179:30184 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01047 | 30185:30194 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01048 | 30195:30297 | NORMAL_TEXT | TABLE row=2 col=3]
Booking associated with the record. FK to public.booking_requests(id). Unique when present. Required.

[P01049 | 30299:30312 | NORMAL_TEXT | TABLE row=3 col=0]
rate_card_id

[P01050 | 30313:30318 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01051 | 30319:30328 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01052 | 30329:30419 | NORMAL_TEXT | TABLE row=3 col=3]
Retained rate card used for the package quotation. FK to public.rate_cards(id). Required.

[P01053 | 30421:30434 | NORMAL_TEXT | TABLE row=4 col=0]
package_code

[P01054 | 30435:30440 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01055 | 30441:30443 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01056 | 30444:30500 | NORMAL_TEXT | TABLE row=4 col=3]
Code identifying the retained rental package. Required.

[P01057 | 30502:30516 | NORMAL_TEXT | TABLE row=5 col=0]
package_label

[P01058 | 30517:30522 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01059 | 30523:30525 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01060 | 30526:30582 | NORMAL_TEXT | TABLE row=5 col=3]
Readable name of the retained rental package. Required.

[P01061 | 30584:30599 | NORMAL_TEXT | TABLE row=6 col=0]
duration_hours

[P01062 | 30600:30608 | NORMAL_TEXT | TABLE row=6 col=1]
INTEGER

[P01063 | 30609:30617 | NORMAL_TEXT | TABLE row=6 col=2]
4 bytes

[P01064 | 30618:30662 | NORMAL_TEXT | TABLE row=6 col=3]
Rental-package duration in hours. Required.

[P01065 | 30664:30683 | NORMAL_TEXT | TABLE row=7 col=0]
base_rental_amount

[P01066 | 30684:30698 | NORMAL_TEXT | TABLE row=7 col=1]
NUMERIC(12,2)

[P01067 | 30699:30721 | NORMAL_TEXT | TABLE row=7 col=2]
Precision 12, scale 2

[P01068 | 30722:30781 | NORMAL_TEXT | TABLE row=7 col=3]
Positive base rental amount in Philippine pesos. Required.

[P01069 | 30783:30796 | NORMAL_TEXT | TABLE row=8 col=0]
delivery_fee

[P01070 | 30797:30811 | NORMAL_TEXT | TABLE row=8 col=1]
NUMERIC(12,2)

[P01071 | 30812:30834 | NORMAL_TEXT | TABLE row=8 col=2]
Precision 12, scale 2

[P01072 | 30835:30882 | NORMAL_TEXT | TABLE row=8 col=3]
Delivery charge in Philippine pesos. Required.

[P01073 | 30884:30902 | NORMAL_TEXT | TABLE row=9 col=0]
approved_discount

[P01074 | 30903:30917 | NORMAL_TEXT | TABLE row=9 col=1]
NUMERIC(12,2)

[P01075 | 30918:30940 | NORMAL_TEXT | TABLE row=9 col=2]
Precision 12, scale 2

[P01076 | 30941:31002 | NORMAL_TEXT | TABLE row=9 col=3]
Nonnegative approved discount in Philippine pesos. Required.

[P01077 | 31004:31022 | NORMAL_TEXT | TABLE row=10 col=0]
approved_subtotal

[P01078 | 31023:31037 | NORMAL_TEXT | TABLE row=10 col=1]
NUMERIC(12,2)

[P01079 | 31038:31060 | NORMAL_TEXT | TABLE row=10 col=2]
Precision 12, scale 2

[P01080 | 31061:31157 | NORMAL_TEXT | TABLE row=10 col=3]
Stored generated amount: base rental amount plus delivery fee less approved discount. Optional.

[P01081 | 31159:31181 | NORMAL_TEXT | TABLE row=11 col=0]
required_down_payment

[P01082 | 31182:31196 | NORMAL_TEXT | TABLE row=11 col=1]
NUMERIC(12,2)

[P01083 | 31197:31219 | NORMAL_TEXT | TABLE row=11 col=2]
Precision 12, scale 2

[P01084 | 31220:31322 | NORMAL_TEXT | TABLE row=11 col=3]
Stored generated amount: 50 percent of the approved subtotal rounded to two decimal places. Optional.

[P01085 | 31324:31338 | NORMAL_TEXT | TABLE row=12 col=0]
quote_version

[P01086 | 31339:31347 | NORMAL_TEXT | TABLE row=12 col=1]
INTEGER

[P01087 | 31348:31356 | NORMAL_TEXT | TABLE row=12 col=2]
4 bytes

[P01088 | 31357:31410 | NORMAL_TEXT | TABLE row=12 col=3]
Positive revision number of the quotation. Required.

[P01089 | 31412:31419 | NORMAL_TEXT | TABLE row=13 col=0]
status

[P01090 | 31420:31425 | NORMAL_TEXT | TABLE row=13 col=1]
TEXT

[P01091 | 31426:31428 | NORMAL_TEXT | TABLE row=13 col=2]
—

[P01092 | 31429:31515 | NORMAL_TEXT | TABLE row=13 col=3]
Retained quotation state, restricted to Approved. Allowed values: Approved. Required.

[P01093 | 31517:31537 | NORMAL_TEXT | TABLE row=14 col=0]
researcher_designed

[P01094 | 31538:31546 | NORMAL_TEXT | TABLE row=14 col=1]
BOOLEAN

[P01095 | 31547:31554 | NORMAL_TEXT | TABLE row=14 col=2]
1 byte

[P01096 | 31555:31652 | NORMAL_TEXT | TABLE row=14 col=3]
Identifies the retained structure as based on the researcher-designed quotation model. Required.

[P01097 | 31654:31666 | NORMAL_TEXT | TABLE row=15 col=0]
approved_by

[P01098 | 31667:31672 | NORMAL_TEXT | TABLE row=15 col=1]
UUID

[P01099 | 31673:31682 | NORMAL_TEXT | TABLE row=15 col=2]
16 bytes

[P01100 | 31683:31770 | NORMAL_TEXT | TABLE row=15 col=3]
User who approved the retained package quotation. FK to public.profiles(id). Required.

[P01101 | 31772:31784 | NORMAL_TEXT | TABLE row=16 col=0]
approved_at

[P01102 | 31785:31797 | NORMAL_TEXT | TABLE row=16 col=1]
TIMESTAMPTZ

[P01103 | 31798:31806 | NORMAL_TEXT | TABLE row=16 col=2]
8 bytes

[P01104 | 31807:31873 | NORMAL_TEXT | TABLE row=16 col=3]
Date and time when the retained quotation was approved. Required.

[P01105 | 31875:31886 | NORMAL_TEXT | TABLE row=17 col=0]
updated_at

[P01106 | 31887:31899 | NORMAL_TEXT | TABLE row=17 col=1]
TIMESTAMPTZ

[P01107 | 31900:31908 | NORMAL_TEXT | TABLE row=17 col=2]
8 bytes

[P01108 | 31909:31964 | NORMAL_TEXT | TABLE row=17 col=3]
Date and time of the latest recorded update. Required.

[P01109 | 31965:32280 | NORMAL_TEXT]
Table 49 describes the table in the database named booking_rate_quotes, where approved package-based quotation snapshots and their computed subtotal and down-payment values are stored as a retained earlier structure. This table is distinct from the current quotation workflow represented by booking_payment_quotes.

[P01110 | 32280:32289 | NORMAL_TEXT]
Table 50

[P01111 | 32289:32327 | NORMAL_TEXT]
Data Dictionary – Rental Transactions

[P01112 | 32327:32328 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01113 | 32331:32342 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01114 | 32343:32353 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01115 | 32354:32365 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01116 | 32366:32378 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01117 | 32380:32383 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01118 | 32384:32389 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01119 | 32390:32399 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01120 | 32400:32457 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01121 | 32459:32470 | NORMAL_TEXT | TABLE row=2 col=0]
booking_id

[P01122 | 32471:32476 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01123 | 32477:32486 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01124 | 32487:32589 | NORMAL_TEXT | TABLE row=2 col=3]
Booking associated with the record. FK to public.booking_requests(id). Unique when present. Required.

[P01125 | 32591:32603 | NORMAL_TEXT | TABLE row=3 col=0]
customer_id

[P01126 | 32604:32609 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01127 | 32610:32619 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01128 | 32620:32694 | NORMAL_TEXT | TABLE row=3 col=3]
Customer associated with the record. FK to public.profiles(id). Required.

[P01129 | 32696:32707 | NORMAL_TEXT | TABLE row=4 col=0]
vehicle_id

[P01130 | 32708:32713 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P01131 | 32714:32723 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P01132 | 32724:32797 | NORMAL_TEXT | TABLE row=4 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P01133 | 32799:32819 | NORMAL_TEXT | TABLE row=5 col=0]
scheduled_pickup_at

[P01134 | 32820:32832 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P01135 | 32833:32841 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P01136 | 32842:32907 | NORMAL_TEXT | TABLE row=5 col=3]
Pickup schedule preserved when the rental is released. Required.

[P01137 | 32909:32929 | NORMAL_TEXT | TABLE row=6 col=0]
scheduled_return_at

[P01138 | 32930:32942 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P01139 | 32943:32951 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P01140 | 32952:33017 | NORMAL_TEXT | TABLE row=6 col=3]
Return schedule preserved when the rental is released. Required.

[P01141 | 33019:33030 | NORMAL_TEXT | TABLE row=7 col=0]
started_at

[P01142 | 33031:33043 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P01143 | 33044:33052 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P01144 | 33053:33131 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when the vehicle was released and the rental started. Required.

[P01145 | 33133:33142 | NORMAL_TEXT | TABLE row=8 col=0]
ended_at

[P01146 | 33143:33155 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P01147 | 33156:33164 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P01148 | 33165:33230 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time when the rental was closed after return. Optional.

[P01149 | 33232:33244 | NORMAL_TEXT | TABLE row=9 col=0]
released_by

[P01150 | 33245:33250 | NORMAL_TEXT | TABLE row=9 col=1]
UUID

[P01151 | 33251:33260 | NORMAL_TEXT | TABLE row=9 col=2]
16 bytes

[P01152 | 33261:33333 | NORMAL_TEXT | TABLE row=9 col=3]
User who recorded vehicle release. FK to public.profiles(id). Required.

[P01153 | 33335:33352 | NORMAL_TEXT | TABLE row=10 col=0]
release_odometer

[P01154 | 33353:33367 | NORMAL_TEXT | TABLE row=10 col=1]
NUMERIC(12,2)

[P01155 | 33368:33390 | NORMAL_TEXT | TABLE row=10 col=2]
Precision 12, scale 2

[P01156 | 33391:33439 | NORMAL_TEXT | TABLE row=10 col=3]
Odometer reading recorded at release. Optional.

[P01157 | 33441:33460 | NORMAL_TEXT | TABLE row=11 col=0]
release_fuel_level

[P01158 | 33461:33466 | NORMAL_TEXT | TABLE row=11 col=1]
TEXT

[P01159 | 33467:33469 | NORMAL_TEXT | TABLE row=11 col=2]
—

[P01160 | 33470:33579 | NORMAL_TEXT | TABLE row=11 col=3]
Recorded fuel level at vehicle release. Allowed values: Empty, 1/4, 1/2, 3/4, Full, Other/Unknown. Required.

[P01161 | 33581:33607 | NORMAL_TEXT | TABLE row=12 col=0]
release_condition_summary

[P01162 | 33608:33613 | NORMAL_TEXT | TABLE row=12 col=1]
TEXT

[P01163 | 33614:33616 | NORMAL_TEXT | TABLE row=12 col=2]
—

[P01164 | 33617:33672 | NORMAL_TEXT | TABLE row=12 col=3]
Summary of the vehicle condition at release. Required.

[P01165 | 33674:33696 | NORMAL_TEXT | TABLE row=13 col=0]
existing_damage_notes

[P01166 | 33697:33702 | NORMAL_TEXT | TABLE row=13 col=1]
TEXT

[P01167 | 33703:33705 | NORMAL_TEXT | TABLE row=13 col=2]
—

[P01168 | 33706:33761 | NORMAL_TEXT | TABLE row=13 col=3]
Damage observations recorded before release. Optional.

[P01169 | 33763:33786 | NORMAL_TEXT | TABLE row=14 col=0]
agreement_acknowledged

[P01170 | 33787:33795 | NORMAL_TEXT | TABLE row=14 col=1]
BOOLEAN

[P01171 | 33796:33803 | NORMAL_TEXT | TABLE row=14 col=2]
1 byte

[P01172 | 33804:33871 | NORMAL_TEXT | TABLE row=14 col=3]
Indicates whether the rental agreement was acknowledged. Required.

[P01173 | 33873:33896 | NORMAL_TEXT | TABLE row=15 col=0]
condition_acknowledged

[P01174 | 33897:33905 | NORMAL_TEXT | TABLE row=15 col=1]
BOOLEAN

[P01175 | 33906:33913 | NORMAL_TEXT | TABLE row=15 col=2]
1 byte

[P01176 | 33914:33982 | NORMAL_TEXT | TABLE row=15 col=3]
Indicates whether the release condition was acknowledged. Required.

[P01177 | 33984:34013 | NORMAL_TEXT | TABLE row=16 col=0]
return_schedule_acknowledged

[P01178 | 34014:34022 | NORMAL_TEXT | TABLE row=16 col=1]
BOOLEAN

[P01179 | 34023:34030 | NORMAL_TEXT | TABLE row=16 col=2]
1 byte

[P01180 | 34031:34097 | NORMAL_TEXT | TABLE row=16 col=3]
Indicates whether the return schedule was acknowledged. Required.

[P01181 | 34099:34110 | NORMAL_TEXT | TABLE row=17 col=0]
created_at

[P01182 | 34111:34123 | NORMAL_TEXT | TABLE row=17 col=1]
TIMESTAMPTZ

[P01183 | 34124:34132 | NORMAL_TEXT | TABLE row=17 col=2]
8 bytes

[P01184 | 34133:34186 | NORMAL_TEXT | TABLE row=17 col=3]
Date and time when the record was created. Required.

[P01185 | 34188:34199 | NORMAL_TEXT | TABLE row=18 col=0]
updated_at

[P01186 | 34200:34212 | NORMAL_TEXT | TABLE row=18 col=1]
TIMESTAMPTZ

[P01187 | 34213:34221 | NORMAL_TEXT | TABLE row=18 col=2]
8 bytes

[P01188 | 34222:34277 | NORMAL_TEXT | TABLE row=18 col=3]
Date and time of the latest recorded update. Required.

[P01189 | 34279:34291 | NORMAL_TEXT | TABLE row=19 col=0]
returned_by

[P01190 | 34292:34297 | NORMAL_TEXT | TABLE row=19 col=1]
UUID

[P01191 | 34298:34307 | NORMAL_TEXT | TABLE row=19 col=2]
16 bytes

[P01192 | 34308:34379 | NORMAL_TEXT | TABLE row=19 col=3]
User who recorded vehicle return. FK to public.profiles(id). Optional.

[P01193 | 34381:34397 | NORMAL_TEXT | TABLE row=20 col=0]
return_odometer

[P01194 | 34398:34412 | NORMAL_TEXT | TABLE row=20 col=1]
NUMERIC(12,2)

[P01195 | 34413:34435 | NORMAL_TEXT | TABLE row=20 col=2]
Precision 12, scale 2

[P01196 | 34436:34483 | NORMAL_TEXT | TABLE row=20 col=3]
Odometer reading recorded at return. Optional.

[P01197 | 34485:34503 | NORMAL_TEXT | TABLE row=21 col=0]
return_fuel_level

[P01198 | 34504:34509 | NORMAL_TEXT | TABLE row=21 col=1]
TEXT

[P01199 | 34510:34512 | NORMAL_TEXT | TABLE row=21 col=2]
—

[P01200 | 34513:34621 | NORMAL_TEXT | TABLE row=21 col=3]
Recorded fuel level at vehicle return. Allowed values: Empty, 1/4, 1/2, 3/4, Full, Other/Unknown. Optional.

[P01201 | 34623:34648 | NORMAL_TEXT | TABLE row=22 col=0]
return_condition_summary

[P01202 | 34649:34654 | NORMAL_TEXT | TABLE row=22 col=1]
TEXT

[P01203 | 34655:34657 | NORMAL_TEXT | TABLE row=22 col=2]
—

[P01204 | 34658:34710 | NORMAL_TEXT | TABLE row=22 col=3]
Summary of vehicle condition upon return. Optional.

[P01205 | 34712:34734 | NORMAL_TEXT | TABLE row=23 col=0]
observed_damage_notes

[P01206 | 34735:34740 | NORMAL_TEXT | TABLE row=23 col=1]
TEXT

[P01207 | 34741:34743 | NORMAL_TEXT | TABLE row=23 col=2]
—

[P01208 | 34744:34796 | NORMAL_TEXT | TABLE row=23 col=3]
Damage observations recorded upon return. Optional.

[P01209 | 34798:34813 | NORMAL_TEXT | TABLE row=24 col=0]
return_remarks

[P01210 | 34814:34819 | NORMAL_TEXT | TABLE row=24 col=1]
TEXT

[P01211 | 34820:34822 | NORMAL_TEXT | TABLE row=24 col=2]
—

[P01212 | 34823:34875 | NORMAL_TEXT | TABLE row=24 col=3]
Additional remarks concerning the return. Optional.

[P01213 | 34877:34895 | NORMAL_TEXT | TABLE row=25 col=0]
inspection_status

[P01214 | 34896:34901 | NORMAL_TEXT | TABLE row=25 col=1]
TEXT

[P01215 | 34902:34904 | NORMAL_TEXT | TABLE row=25 col=2]
—

[P01216 | 34905:35045 | NORMAL_TEXT | TABLE row=25 col=3]
State of the return inspection recorded within the rental. Allowed values: Not required, Pending, Cleared, Maintenance scheduled. Required.

[P01217 | 35047:35066 | NORMAL_TEXT | TABLE row=26 col=0]
inspection_remarks

[P01218 | 35067:35072 | NORMAL_TEXT | TABLE row=26 col=1]
TEXT

[P01219 | 35073:35075 | NORMAL_TEXT | TABLE row=26 col=2]
—

[P01220 | 35076:35128 | NORMAL_TEXT | TABLE row=26 col=3]
Remarks concerning the return inspection. Optional.

[P01221 | 35130:35143 | NORMAL_TEXT | TABLE row=27 col=0]
inspected_at

[P01222 | 35144:35156 | NORMAL_TEXT | TABLE row=27 col=1]
TIMESTAMPTZ

[P01223 | 35157:35165 | NORMAL_TEXT | TABLE row=27 col=2]
8 bytes

[P01224 | 35166:35216 | NORMAL_TEXT | TABLE row=27 col=3]
Date and time of the return inspection. Optional.

[P01225 | 35218:35231 | NORMAL_TEXT | TABLE row=28 col=0]
inspected_by

[P01226 | 35232:35237 | NORMAL_TEXT | TABLE row=28 col=1]
UUID

[P01227 | 35238:35247 | NORMAL_TEXT | TABLE row=28 col=2]
16 bytes

[P01228 | 35248:35326 | NORMAL_TEXT | TABLE row=28 col=3]
User who recorded the return inspection. FK to public.profiles(id). Optional.

[P01229 | 35327:35637 | NORMAL_TEXT]
Table 50 describes the table in the database named rental_transactions, where vehicle release, customer acknowledgements, actual rental start and end, return condition, and inspection information are recorded. Return inspection is embedded in this record rather than maintained in a separate inspection table.

[P01230 | 35637:35646 | NORMAL_TEXT]
Table 51

[P01231 | 35646:35684 | NORMAL_TEXT]
Data Dictionary – Maintenance Records

[P01232 | 35684:35685 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01233 | 35688:35699 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01234 | 35700:35710 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01235 | 35711:35722 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01236 | 35723:35735 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01237 | 35737:35740 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01238 | 35741:35746 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01239 | 35747:35756 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01240 | 35757:35814 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01241 | 35816:35827 | NORMAL_TEXT | TABLE row=2 col=0]
vehicle_id

[P01242 | 35828:35833 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01243 | 35834:35843 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01244 | 35844:35917 | NORMAL_TEXT | TABLE row=2 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P01245 | 35919:35936 | NORMAL_TEXT | TABLE row=3 col=0]
maintenance_type

[P01246 | 35937:35942 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P01247 | 35943:35945 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P01248 | 35946:36004 | NORMAL_TEXT | TABLE row=3 col=3]
Recorded service or maintenance classification. Required.

[P01249 | 36006:36018 | NORMAL_TEXT | TABLE row=4 col=0]
description

[P01250 | 36019:36024 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01251 | 36025:36027 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01252 | 36028:36075 | NORMAL_TEXT | TABLE row=4 col=3]
Description of the maintenance work. Required.

[P01253 | 36077:36084 | NORMAL_TEXT | TABLE row=5 col=0]
status

[P01254 | 36085:36090 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01255 | 36091:36093 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01256 | 36094:36205 | NORMAL_TEXT | TABLE row=5 col=3]
Recorded state of the record. Allowed values: Scheduled, In Progress, Completed, Overdue, Cancelled. Required.

[P01257 | 36207:36225 | NORMAL_TEXT | TABLE row=6 col=0]
blocks_rental_use

[P01258 | 36226:36234 | NORMAL_TEXT | TABLE row=6 col=1]
BOOLEAN

[P01259 | 36235:36242 | NORMAL_TEXT | TABLE row=6 col=2]
1 byte

[P01260 | 36243:36314 | NORMAL_TEXT | TABLE row=6 col=3]
Indicates whether this maintenance record blocks rental use. Required.

[P01261 | 36316:36335 | NORMAL_TEXT | TABLE row=7 col=0]
service_started_at

[P01262 | 36336:36348 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P01263 | 36349:36357 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P01264 | 36358:36404 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when servicing began. Optional.

[P01265 | 36406:36419 | NORMAL_TEXT | TABLE row=8 col=0]
completed_at

[P01266 | 36420:36432 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P01267 | 36433:36441 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P01268 | 36442:36496 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time when the operation completed. Optional.

[P01269 | 36498:36518 | NORMAL_TEXT | TABLE row=9 col=0]
odometer_at_service

[P01270 | 36519:36533 | NORMAL_TEXT | TABLE row=9 col=1]
NUMERIC(12,1)

[P01271 | 36534:36556 | NORMAL_TEXT | TABLE row=9 col=2]
Precision 12, scale 1

[P01272 | 36557:36627 | NORMAL_TEXT | TABLE row=9 col=3]
Odometer reading in kilometers associated with the service. Optional.

[P01273 | 36629:36651 | NORMAL_TEXT | TABLE row=10 col=0]
next_service_odometer

[P01274 | 36652:36666 | NORMAL_TEXT | TABLE row=10 col=1]
NUMERIC(12,1)

[P01275 | 36667:36689 | NORMAL_TEXT | TABLE row=10 col=2]
Precision 12, scale 1

[P01276 | 36690:36755 | NORMAL_TEXT | TABLE row=10 col=3]
Odometer threshold in kilometers for the next service. Optional.

[P01277 | 36757:36775 | NORMAL_TEXT | TABLE row=11 col=0]
next_service_date

[P01278 | 36776:36781 | NORMAL_TEXT | TABLE row=11 col=1]
DATE

[P01279 | 36782:36790 | NORMAL_TEXT | TABLE row=11 col=2]
4 bytes

[P01280 | 36791:36838 | NORMAL_TEXT | TABLE row=11 col=3]
Date threshold for the next service. Optional.

[P01281 | 36840:36849 | NORMAL_TEXT | TABLE row=12 col=0]
cost_php

[P01282 | 36850:36864 | NORMAL_TEXT | TABLE row=12 col=1]
NUMERIC(12,2)

[P01283 | 36865:36887 | NORMAL_TEXT | TABLE row=12 col=2]
Precision 12, scale 2

[P01284 | 36888:36945 | NORMAL_TEXT | TABLE row=12 col=3]
Recorded maintenance cost in Philippine pesos. Optional.

[P01285 | 36947:36955 | NORMAL_TEXT | TABLE row=13 col=0]
remarks

[P01286 | 36956:36961 | NORMAL_TEXT | TABLE row=13 col=1]
TEXT

[P01287 | 36962:36964 | NORMAL_TEXT | TABLE row=13 col=2]
—

[P01288 | 36965:37022 | NORMAL_TEXT | TABLE row=13 col=3]
Additional remarks associated with the record. Optional.

[P01289 | 37024:37035 | NORMAL_TEXT | TABLE row=14 col=0]
created_by

[P01290 | 37036:37041 | NORMAL_TEXT | TABLE row=14 col=1]
UUID

[P01291 | 37042:37051 | NORMAL_TEXT | TABLE row=14 col=2]
16 bytes

[P01292 | 37052:37139 | NORMAL_TEXT | TABLE row=14 col=3]
Authenticated user who created the maintenance record. FK to auth.users(id). Required.

[P01293 | 37141:37152 | NORMAL_TEXT | TABLE row=15 col=0]
updated_by

[P01294 | 37153:37158 | NORMAL_TEXT | TABLE row=15 col=1]
UUID

[P01295 | 37159:37168 | NORMAL_TEXT | TABLE row=15 col=2]
16 bytes

[P01296 | 37169:37261 | NORMAL_TEXT | TABLE row=15 col=3]
Authenticated user who last updated the maintenance record. FK to auth.users(id). Required.

[P01297 | 37263:37274 | NORMAL_TEXT | TABLE row=16 col=0]
created_at

[P01298 | 37275:37287 | NORMAL_TEXT | TABLE row=16 col=1]
TIMESTAMPTZ

[P01299 | 37288:37296 | NORMAL_TEXT | TABLE row=16 col=2]
8 bytes

[P01300 | 37297:37350 | NORMAL_TEXT | TABLE row=16 col=3]
Date and time when the record was created. Required.

[P01301 | 37352:37363 | NORMAL_TEXT | TABLE row=17 col=0]
updated_at

[P01302 | 37364:37376 | NORMAL_TEXT | TABLE row=17 col=1]
TIMESTAMPTZ

[P01303 | 37377:37385 | NORMAL_TEXT | TABLE row=17 col=2]
8 bytes

[P01304 | 37386:37441 | NORMAL_TEXT | TABLE row=17 col=3]
Date and time of the latest recorded update. Required.

[P01305 | 37443:37457 | NORMAL_TEXT | TABLE row=18 col=0]
scheduled_for

[P01306 | 37458:37470 | NORMAL_TEXT | TABLE row=18 col=1]
TIMESTAMPTZ

[P01307 | 37471:37479 | NORMAL_TEXT | TABLE row=18 col=2]
8 bytes

[P01308 | 37480:37531 | NORMAL_TEXT | TABLE row=18 col=3]
Date and time scheduled for maintenance. Optional.

[P01309 | 37533:37545 | NORMAL_TEXT | TABLE row=19 col=0]
archived_at

[P01310 | 37546:37558 | NORMAL_TEXT | TABLE row=19 col=1]
TIMESTAMPTZ

[P01311 | 37559:37567 | NORMAL_TEXT | TABLE row=19 col=2]
8 bytes

[P01312 | 37568:37622 | NORMAL_TEXT | TABLE row=19 col=3]
Date and time when the record was archived. Optional.

[P01313 | 37624:37636 | NORMAL_TEXT | TABLE row=20 col=0]
archived_by

[P01314 | 37637:37642 | NORMAL_TEXT | TABLE row=20 col=1]
UUID

[P01315 | 37643:37652 | NORMAL_TEXT | TABLE row=20 col=2]
16 bytes

[P01316 | 37653:37720 | NORMAL_TEXT | TABLE row=20 col=3]
User who archived the record. FK to public.profiles(id). Optional.

[P01317 | 37721:38053 | NORMAL_TEXT]
Table 51 describes the table in the database named maintenance_records, where scheduled servicing, work in progress, completion, overdue or cancelled work, rental-use restrictions, service readings, and archival information are maintained. Maintenance lifecycle states are Scheduled, In Progress, Completed, Overdue, and Cancelled.

[P01318 | 38053:38062 | NORMAL_TEXT]
Table 52

[P01319 | 38062:38094 | NORMAL_TEXT]
Data Dictionary – Forecast Runs

[P01320 | 38094:38095 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01321 | 38098:38109 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01322 | 38110:38120 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01323 | 38121:38132 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01324 | 38133:38145 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01325 | 38147:38150 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01326 | 38151:38156 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01327 | 38157:38166 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01328 | 38167:38224 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01329 | 38226:38239 | NORMAL_TEXT | TABLE row=2 col=0]
generated_at

[P01330 | 38240:38252 | NORMAL_TEXT | TABLE row=2 col=1]
TIMESTAMPTZ

[P01331 | 38253:38261 | NORMAL_TEXT | TABLE row=2 col=2]
8 bytes

[P01332 | 38262:38330 | NORMAL_TEXT | TABLE row=2 col=3]
Date and time when the generation operation was recorded. Required.

[P01333 | 38332:38345 | NORMAL_TEXT | TABLE row=3 col=0]
generated_by

[P01334 | 38346:38351 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01335 | 38352:38361 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01336 | 38362:38444 | NORMAL_TEXT | TABLE row=3 col=3]
User who initiated the generation operation. FK to public.profiles(id). Required.

[P01337 | 38446:38453 | NORMAL_TEXT | TABLE row=4 col=0]
method

[P01338 | 38454:38459 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01339 | 38460:38462 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01340 | 38463:38512 | NORMAL_TEXT | TABLE row=4 col=3]
Forecasting method, restricted to WMA. Required.

[P01341 | 38514:38530 | NORMAL_TEXT | TABLE row=5 col=0]
idempotency_key

[P01342 | 38531:38536 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01343 | 38537:38539 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01344 | 38540:38650 | NORMAL_TEXT | TABLE row=5 col=3]
Request identifier used to prevent duplicate processing of the same operation. Unique when present. Required.

[P01345 | 38652:38667 | NORMAL_TEXT | TABLE row=6 col=0]
coverage_start

[P01346 | 38668:38673 | NORMAL_TEXT | TABLE row=6 col=1]
DATE

[P01347 | 38674:38682 | NORMAL_TEXT | TABLE row=6 col=2]
4 bytes

[P01348 | 38683:38755 | NORMAL_TEXT | TABLE row=6 col=3]
Beginning date of historical demand coverage used by the run. Optional.

[P01349 | 38756:38958 | NORMAL_TEXT]
Table 52 describes the table in the database named forecast_runs, where each Weighted Moving Average forecast-generation run, its initiating user, method, and historical coverage boundary are recorded.

[P01350 | 38958:38967 | NORMAL_TEXT]
Table 53

[P01351 | 38967:39002 | NORMAL_TEXT]
Data Dictionary – Demand Forecasts

[P01352 | 39002:39003 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01353 | 39006:39017 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01354 | 39018:39028 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01355 | 39029:39040 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01356 | 39041:39053 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01357 | 39055:39058 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01358 | 39059:39064 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01359 | 39065:39074 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01360 | 39075:39132 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01361 | 39134:39141 | NORMAL_TEXT | TABLE row=2 col=0]
run_id

[P01362 | 39142:39147 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01363 | 39148:39157 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01364 | 39158:39257 | NORMAL_TEXT | TABLE row=2 col=3]
Forecast-generation run to which the projection belongs. FK to public.forecast_runs(id). Required.

[P01365 | 39259:39269 | NORMAL_TEXT | TABLE row=3 col=0]
branch_id

[P01366 | 39270:39275 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01367 | 39276:39285 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01368 | 39286:39370 | NORMAL_TEXT | TABLE row=3 col=3]
Operational branch associated with the record. FK to public.branches(id). Required.

[P01369 | 39372:39392 | NORMAL_TEXT | TABLE row=4 col=0]
vehicle_category_id

[P01370 | 39393:39398 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P01371 | 39399:39408 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P01372 | 39409:39503 | NORMAL_TEXT | TABLE row=4 col=3]
Vehicle category for which the record applies. FK to public.vehicle_categories(id). Required.

[P01373 | 39505:39513 | NORMAL_TEXT | TABLE row=5 col=0]
horizon

[P01374 | 39514:39523 | NORMAL_TEXT | TABLE row=5 col=1]
SMALLINT

[P01375 | 39524:39532 | NORMAL_TEXT | TABLE row=5 col=2]
2 bytes

[P01376 | 39533:39587 | NORMAL_TEXT | TABLE row=5 col=3]
Projection horizon from one to three weeks. Required.

[P01377 | 39589:39607 | NORMAL_TEXT | TABLE row=6 col=0]
target_week_start

[P01378 | 39608:39613 | NORMAL_TEXT | TABLE row=6 col=1]
DATE

[P01379 | 39614:39622 | NORMAL_TEXT | TABLE row=6 col=2]
4 bytes

[P01380 | 39623:39691 | NORMAL_TEXT | TABLE row=6 col=3]
Beginning date of the forecast or allocation target week. Required.

[P01381 | 39693:39709 | NORMAL_TEXT | TABLE row=7 col=0]
target_week_end

[P01382 | 39710:39715 | NORMAL_TEXT | TABLE row=7 col=1]
DATE

[P01383 | 39716:39724 | NORMAL_TEXT | TABLE row=7 col=2]
4 bytes

[P01384 | 39725:39794 | NORMAL_TEXT | TABLE row=7 col=3]
Ending boundary of the forecast or allocation target week. Required.

[P01385 | 39796:39814 | NORMAL_TEXT | TABLE row=8 col=0]
forecasted_demand

[P01386 | 39815:39829 | NORMAL_TEXT | TABLE row=8 col=1]
NUMERIC(18,8)

[P01387 | 39830:39852 | NORMAL_TEXT | TABLE row=8 col=2]
Precision 18, scale 8

[P01388 | 39853:39921 | NORMAL_TEXT | TABLE row=8 col=3]
Decimal weekly vehicle-demand projection produced by WMA. Required.

[P01389 | 39923:39946 | NORMAL_TEXT | TABLE row=9 col=0]
required_vehicle_units

[P01390 | 39947:39955 | NORMAL_TEXT | TABLE row=9 col=1]
INTEGER

[P01391 | 39956:39964 | NORMAL_TEXT | TABLE row=9 col=2]
4 bytes

[P01392 | 39965:40063 | NORMAL_TEXT | TABLE row=9 col=3]
Whole vehicle units required for planning, obtained by rounding forecast demand upward. Required.

[P01393 | 40065:40079 | NORMAL_TEXT | TABLE row=10 col=0]
actual_demand

[P01394 | 40080:40094 | NORMAL_TEXT | TABLE row=10 col=1]
NUMERIC(18,8)

[P01395 | 40095:40117 | NORMAL_TEXT | TABLE row=10 col=2]
Precision 18, scale 8

[P01396 | 40118:40191 | NORMAL_TEXT | TABLE row=10 col=3]
Observed demand for the completed target week, when finalized. Optional.

[P01397 | 40193:40197 | NORMAL_TEXT | TABLE row=11 col=0]
ape

[P01398 | 40198:40212 | NORMAL_TEXT | TABLE row=11 col=1]
NUMERIC(18,8)

[P01399 | 40213:40235 | NORMAL_TEXT | TABLE row=11 col=2]
Precision 18, scale 8

[P01400 | 40236:40341 | NORMAL_TEXT | TABLE row=11 col=3]
Absolute percentage error for the forecast when a valid actual-demand comparison is available. Optional.

[P01401 | 40343:40354 | NORMAL_TEXT | TABLE row=12 col=0]
created_at

[P01402 | 40355:40367 | NORMAL_TEXT | TABLE row=12 col=1]
TIMESTAMPTZ

[P01403 | 40368:40376 | NORMAL_TEXT | TABLE row=12 col=2]
8 bytes

[P01404 | 40377:40430 | NORMAL_TEXT | TABLE row=12 col=3]
Date and time when the record was created. Required.

[P01405 | 40431:40698 | NORMAL_TEXT]
Table 53 describes the table in the database named forecasts, where weekly vehicle-demand projections for each branch and vehicle category are stored, together with the forecast horizon, required vehicle units, and subsequent actual-demand and accuracy observations.

[P01406 | 40698:40707 | NORMAL_TEXT]
Table 54

[P01407 | 40707:40741 | NORMAL_TEXT]
Data Dictionary – Forecast Inputs

[P01408 | 40741:40742 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01409 | 40745:40756 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01410 | 40757:40767 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01411 | 40768:40779 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01412 | 40780:40792 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01413 | 40794:40797 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01414 | 40798:40803 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01415 | 40804:40813 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01416 | 40814:40871 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01417 | 40873:40885 | NORMAL_TEXT | TABLE row=2 col=0]
forecast_id

[P01418 | 40886:40891 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01419 | 40892:40901 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01420 | 40902:40979 | NORMAL_TEXT | TABLE row=2 col=3]
Forecast to which this record belongs. FK to public.forecasts(id). Required.

[P01421 | 40981:40993 | NORMAL_TEXT | TABLE row=3 col=0]
source_type

[P01422 | 40994:40999 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P01423 | 41000:41002 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P01424 | 41003:41152 | NORMAL_TEXT | TABLE row=3 col=3]
Indicates whether the calculation input is an observed actual value or a recursively generated forecast. Allowed values: Actual, Forecast. Required.

[P01425 | 41154:41172 | NORMAL_TEXT | TABLE row=4 col=0]
source_week_start

[P01426 | 41173:41178 | NORMAL_TEXT | TABLE row=4 col=1]
DATE

[P01427 | 41179:41187 | NORMAL_TEXT | TABLE row=4 col=2]
4 bytes

[P01428 | 41188:41232 | NORMAL_TEXT | TABLE row=4 col=3]
Beginning date of the input week. Required.

[P01429 | 41234:41247 | NORMAL_TEXT | TABLE row=5 col=0]
source_value

[P01430 | 41248:41262 | NORMAL_TEXT | TABLE row=5 col=1]
NUMERIC(18,8)

[P01431 | 41263:41285 | NORMAL_TEXT | TABLE row=5 col=2]
Precision 18, scale 8

[P01432 | 41286:41338 | NORMAL_TEXT | TABLE row=5 col=3]
Demand value used as a calculation input. Required.

[P01433 | 41340:41352 | NORMAL_TEXT | TABLE row=6 col=0]
input_order

[P01434 | 41353:41362 | NORMAL_TEXT | TABLE row=6 col=1]
SMALLINT

[P01435 | 41363:41371 | NORMAL_TEXT | TABLE row=6 col=2]
2 bytes

[P01436 | 41372:41449 | NORMAL_TEXT | TABLE row=6 col=3]
Recency position from 1 to 3; position 1 is the most recent input. Required.

[P01437 | 41451:41458 | NORMAL_TEXT | TABLE row=7 col=0]
weight

[P01438 | 41459:41472 | NORMAL_TEXT | TABLE row=7 col=1]
NUMERIC(5,4)

[P01439 | 41473:41494 | NORMAL_TEXT | TABLE row=7 col=2]
Precision 5, scale 4

[P01440 | 41495:41539 | NORMAL_TEXT | TABLE row=7 col=3]
WMA weight assigned to the input. Required.

[P01441 | 41541:41563 | NORMAL_TEXT | TABLE row=8 col=0]
weighted_contribution

[P01442 | 41564:41578 | NORMAL_TEXT | TABLE row=8 col=1]
NUMERIC(18,8)

[P01443 | 41579:41601 | NORMAL_TEXT | TABLE row=8 col=2]
Precision 18, scale 8

[P01444 | 41602:41671 | NORMAL_TEXT | TABLE row=8 col=3]
Product of the input demand value and its assigned weight. Required.

[P01445 | 41673:41684 | NORMAL_TEXT | TABLE row=9 col=0]
created_at

[P01446 | 41685:41697 | NORMAL_TEXT | TABLE row=9 col=1]
TIMESTAMPTZ

[P01447 | 41698:41706 | NORMAL_TEXT | TABLE row=9 col=2]
8 bytes

[P01448 | 41707:41760 | NORMAL_TEXT | TABLE row=9 col=3]
Date and time when the record was created. Required.

[P01449 | 41761:42081 | NORMAL_TEXT]
Table 54 describes the table in the database named forecast_inputs, where the source observations or recursive forecast values, recency order, weights, and weighted contributions used by a forecast are preserved. The study applies three-period WMA weights of 0.50, 0.30, and 0.20 from most recent to least recent input.

[P01450 | 42081:42090 | NORMAL_TEXT]
Table 55

[P01451 | 42090:42133 | NORMAL_TEXT]
Data Dictionary – Forecast Demand Coverage

[P01452 | 42133:42134 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01453 | 42137:42148 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01454 | 42149:42159 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01455 | 42160:42171 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01456 | 42172:42184 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01457 | 42186:42189 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01458 | 42190:42199 | NORMAL_TEXT | TABLE row=1 col=1]
SMALLINT

[P01459 | 42200:42208 | NORMAL_TEXT | TABLE row=1 col=2]
2 bytes

[P01460 | 42209:42279 | NORMAL_TEXT | TABLE row=1 col=3]
Single-row primary-key value, restricted to 1. Primary key. Required.

[P01461 | 42281:42301 | NORMAL_TEXT | TABLE row=2 col=0]
tracking_started_at

[P01462 | 42302:42314 | NORMAL_TEXT | TABLE row=2 col=1]
TIMESTAMPTZ

[P01463 | 42315:42323 | NORMAL_TEXT | TABLE row=2 col=2]
8 bytes

[P01464 | 42324:42393 | NORMAL_TEXT | TABLE row=2 col=3]
Date and time at which trustworthy demand tracking begins. Required.

[P01465 | 42395:42406 | NORMAL_TEXT | TABLE row=3 col=0]
created_at

[P01466 | 42407:42419 | NORMAL_TEXT | TABLE row=3 col=1]
TIMESTAMPTZ

[P01467 | 42420:42428 | NORMAL_TEXT | TABLE row=3 col=2]
8 bytes

[P01468 | 42429:42482 | NORMAL_TEXT | TABLE row=3 col=3]
Date and time when the record was created. Required.

[P01469 | 42483:42768 | NORMAL_TEXT]
Table 55 describes the table in the database named forecast_demand_coverage, where the beginning of trustworthy demand tracking is recorded in a single-row coverage record. This boundary helps distinguish complete zero-demand periods from periods without adequate historical coverage.

[P01470 | 42768:42777 | NORMAL_TEXT]
Table 56

[P01471 | 42777:42814 | NORMAL_TEXT]
Data Dictionary – Supply Evaluations

[P01472 | 42814:42815 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01473 | 42818:42829 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01474 | 42830:42840 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01475 | 42841:42852 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01476 | 42853:42865 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01477 | 42867:42870 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01478 | 42871:42876 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01479 | 42877:42886 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01480 | 42887:42944 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01481 | 42946:42958 | NORMAL_TEXT | TABLE row=2 col=0]
forecast_id

[P01482 | 42959:42964 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01483 | 42965:42974 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01484 | 42975:43052 | NORMAL_TEXT | TABLE row=2 col=3]
Forecast to which this record belongs. FK to public.forecasts(id). Required.

[P01485 | 43054:43067 | NORMAL_TEXT | TABLE row=3 col=0]
evaluated_at

[P01486 | 43068:43080 | NORMAL_TEXT | TABLE row=3 col=1]
TIMESTAMPTZ

[P01487 | 43081:43089 | NORMAL_TEXT | TABLE row=3 col=2]
8 bytes

[P01488 | 43090:43150 | NORMAL_TEXT | TABLE row=3 col=3]
Date and time when projected supply was assessed. Required.

[P01489 | 43152:43165 | NORMAL_TEXT | TABLE row=4 col=0]
evaluated_by

[P01490 | 43166:43171 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P01491 | 43172:43181 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P01492 | 43182:43261 | NORMAL_TEXT | TABLE row=4 col=3]
User who initiated the supply assessment. FK to public.profiles(id). Required.

[P01493 | 43263:43279 | NORMAL_TEXT | TABLE row=5 col=0]
idempotency_key

[P01494 | 43280:43285 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01495 | 43286:43288 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01496 | 43289:43399 | NORMAL_TEXT | TABLE row=5 col=3]
Request identifier used to prevent duplicate processing of the same operation. Unique when present. Required.

[P01497 | 43401:43425 | NORMAL_TEXT | TABLE row=6 col=0]
required_units_snapshot

[P01498 | 43426:43434 | NORMAL_TEXT | TABLE row=6 col=1]
INTEGER

[P01499 | 43435:43443 | NORMAL_TEXT | TABLE row=6 col=2]
4 bytes

[P01500 | 43444:43516 | NORMAL_TEXT | TABLE row=6 col=3]
Required vehicle units preserved from the evaluated forecast. Required.

[P01501 | 43518:43535 | NORMAL_TEXT | TABLE row=7 col=0]
projected_supply

[P01502 | 43536:43544 | NORMAL_TEXT | TABLE row=7 col=1]
INTEGER

[P01503 | 43545:43553 | NORMAL_TEXT | TABLE row=7 col=2]
4 bytes

[P01504 | 43554:43631 | NORMAL_TEXT | TABLE row=7 col=3]
Number of vehicles projected to be eligible for the target period. Required.

[P01505 | 43633:43648 | NORMAL_TEXT | TABLE row=8 col=0]
shortage_units

[P01506 | 43649:43657 | NORMAL_TEXT | TABLE row=8 col=1]
INTEGER

[P01507 | 43658:43666 | NORMAL_TEXT | TABLE row=8 col=2]
4 bytes

[P01508 | 43667:43743 | NORMAL_TEXT | TABLE row=8 col=3]
Nonnegative shortfall of projected supply against required units. Required.

[P01509 | 43745:43759 | NORMAL_TEXT | TABLE row=9 col=0]
surplus_units

[P01510 | 43760:43768 | NORMAL_TEXT | TABLE row=9 col=1]
INTEGER

[P01511 | 43769:43777 | NORMAL_TEXT | TABLE row=9 col=2]
4 bytes

[P01512 | 43778:43848 | NORMAL_TEXT | TABLE row=9 col=3]
Nonnegative excess of projected supply over required units. Required.

[P01513 | 43850:43869 | NORMAL_TEXT | TABLE row=10 col=0]
data_quality_state

[P01514 | 43870:43875 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P01515 | 43876:43878 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P01516 | 43879:43977 | NORMAL_TEXT | TABLE row=10 col=3]
Recorded qualification concerning the reliability or completeness of evaluation inputs. Optional.

[P01517 | 43979:43990 | NORMAL_TEXT | TABLE row=11 col=0]
created_at

[P01518 | 43991:44003 | NORMAL_TEXT | TABLE row=11 col=1]
TIMESTAMPTZ

[P01519 | 44004:44012 | NORMAL_TEXT | TABLE row=11 col=2]
8 bytes

[P01520 | 44013:44066 | NORMAL_TEXT | TABLE row=11 col=3]
Date and time when the record was created. Required.

[P01521 | 44067:44312 | NORMAL_TEXT]
Table 56 describes the table in the database named supply_evaluations, where a forecast’s required units are compared with projected eligible vehicle supply, preserving shortage, surplus, and data-quality observations at the time of evaluation.

[P01522 | 44312:44321 | NORMAL_TEXT]
Table 57

[P01523 | 44321:44366 | NORMAL_TEXT]
Data Dictionary – Supply Evaluation Vehicles

[P01524 | 44366:44367 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01525 | 44370:44381 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01526 | 44382:44392 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01527 | 44393:44404 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01528 | 44405:44417 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01529 | 44419:44422 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01530 | 44423:44428 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01531 | 44429:44438 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01532 | 44439:44496 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01533 | 44498:44512 | NORMAL_TEXT | TABLE row=2 col=0]
evaluation_id

[P01534 | 44513:44518 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01535 | 44519:44528 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01536 | 44529:44636 | NORMAL_TEXT | TABLE row=2 col=3]
Supply evaluation to which this vehicle assessment belongs. FK to public.supply_evaluations(id). Required.

[P01537 | 44638:44649 | NORMAL_TEXT | TABLE row=3 col=0]
vehicle_id

[P01538 | 44650:44655 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01539 | 44656:44665 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01540 | 44666:44739 | NORMAL_TEXT | TABLE row=3 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P01541 | 44741:44750 | NORMAL_TEXT | TABLE row=4 col=0]
eligible

[P01542 | 44751:44759 | NORMAL_TEXT | TABLE row=4 col=1]
BOOLEAN

[P01543 | 44760:44767 | NORMAL_TEXT | TABLE row=4 col=2]
1 byte

[P01544 | 44768:44851 | NORMAL_TEXT | TABLE row=4 col=3]
Indicates whether the vehicle was eligible during the supply assessment. Required.

[P01545 | 44853:44870 | NORMAL_TEXT | TABLE row=5 col=0]
booking_conflict

[P01546 | 44871:44879 | NORMAL_TEXT | TABLE row=5 col=1]
BOOLEAN

[P01547 | 44880:44887 | NORMAL_TEXT | TABLE row=5 col=2]
1 byte

[P01548 | 44888:44951 | NORMAL_TEXT | TABLE row=5 col=3]
Indicates whether a booking conflict was identified. Required.

[P01549 | 44953:44969 | NORMAL_TEXT | TABLE row=6 col=0]
rental_conflict

[P01550 | 44970:44978 | NORMAL_TEXT | TABLE row=6 col=1]
BOOLEAN

[P01551 | 44979:44986 | NORMAL_TEXT | TABLE row=6 col=2]
1 byte

[P01552 | 44987:45057 | NORMAL_TEXT | TABLE row=6 col=3]
Indicates whether an active-rental conflict was identified. Required.

[P01553 | 45059:45087 | NORMAL_TEXT | TABLE row=7 col=0]
future_maintenance_conflict

[P01554 | 45088:45096 | NORMAL_TEXT | TABLE row=7 col=1]
BOOLEAN

[P01555 | 45097:45104 | NORMAL_TEXT | TABLE row=7 col=2]
1 byte

[P01556 | 45105:45186 | NORMAL_TEXT | TABLE row=7 col=3]
Indicates whether future maintenance conflicts with the target period. Required.

[P01557 | 45188:45206 | NORMAL_TEXT | TABLE row=8 col=0]
exclusion_reasons

[P01558 | 45207:45213 | NORMAL_TEXT | TABLE row=8 col=1]
JSONB

[P01559 | 45214:45216 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P01560 | 45217:45310 | NORMAL_TEXT | TABLE row=8 col=3]
Structured explanations of conditions excluding the vehicle from projected supply. Required.

[P01561 | 45312:45323 | NORMAL_TEXT | TABLE row=9 col=0]
created_at

[P01562 | 45324:45336 | NORMAL_TEXT | TABLE row=9 col=1]
TIMESTAMPTZ

[P01563 | 45337:45345 | NORMAL_TEXT | TABLE row=9 col=2]
8 bytes

[P01564 | 45346:45399 | NORMAL_TEXT | TABLE row=9 col=3]
Date and time when the record was created. Required.

[P01565 | 45400:45640 | NORMAL_TEXT]
Table 57 describes the table in the database named supply_evaluation_vehicles, where vehicle-level eligibility, booking and rental conflicts, future maintenance conflicts, and exclusion explanations are captured for each supply evaluation.

[P01566 | 45640:45649 | NORMAL_TEXT]
Table 58

[P01567 | 45649:45701 | NORMAL_TEXT]
Data Dictionary – Allocation Recommendation Batches

[P01568 | 45701:45702 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01569 | 45705:45716 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01570 | 45717:45727 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01571 | 45728:45739 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01572 | 45740:45752 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01573 | 45754:45757 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01574 | 45758:45763 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01575 | 45764:45773 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01576 | 45774:45831 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01577 | 45833:45846 | NORMAL_TEXT | TABLE row=2 col=0]
generated_by

[P01578 | 45847:45852 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01579 | 45853:45862 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01580 | 45863:45945 | NORMAL_TEXT | TABLE row=2 col=3]
User who initiated the generation operation. FK to public.profiles(id). Required.

[P01581 | 45947:45960 | NORMAL_TEXT | TABLE row=3 col=0]
generated_at

[P01582 | 45961:45973 | NORMAL_TEXT | TABLE row=3 col=1]
TIMESTAMPTZ

[P01583 | 45974:45982 | NORMAL_TEXT | TABLE row=3 col=2]
8 bytes

[P01584 | 45983:46051 | NORMAL_TEXT | TABLE row=3 col=3]
Date and time when the generation operation was recorded. Required.

[P01585 | 46053:46069 | NORMAL_TEXT | TABLE row=4 col=0]
idempotency_key

[P01586 | 46070:46075 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01587 | 46076:46078 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01588 | 46079:46189 | NORMAL_TEXT | TABLE row=4 col=3]
Request identifier used to prevent duplicate processing of the same operation. Unique when present. Required.

[P01589 | 46191:46222 | NORMAL_TEXT | TABLE row=5 col=0]
generation_context_fingerprint

[P01590 | 46223:46228 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01591 | 46229:46231 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01592 | 46232:46323 | NORMAL_TEXT | TABLE row=5 col=3]
Fingerprint of the evaluation context used to generate the recommendation batch. Required.

[P01593 | 46325:46336 | NORMAL_TEXT | TABLE row=6 col=0]
created_at

[P01594 | 46337:46349 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P01595 | 46350:46358 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P01596 | 46359:46412 | NORMAL_TEXT | TABLE row=6 col=3]
Date and time when the record was created. Required.

[P01597 | 46413:46679 | NORMAL_TEXT]
Table 58 describes the table in the database named allocation_recommendation_batches, where each allocation-recommendation generation event and its context fingerprint are recorded, allowing the resulting recommendations to be traced to a common evaluation context.

[P01598 | 46679:46688 | NORMAL_TEXT]
Table 59

[P01599 | 46688:46733 | NORMAL_TEXT]
Data Dictionary – Allocation Recommendations

[P01600 | 46733:46734 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01601 | 46737:46748 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01602 | 46749:46759 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01603 | 46760:46771 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01604 | 46772:46784 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01605 | 46786:46789 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01606 | 46790:46795 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01607 | 46796:46805 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01608 | 46806:46863 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01609 | 46865:46874 | NORMAL_TEXT | TABLE row=2 col=0]
batch_id

[P01610 | 46875:46880 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01611 | 46881:46890 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01612 | 46891:47007 | NORMAL_TEXT | TABLE row=2 col=3]
Generation batch to which the recommendation belongs. FK to public.allocation_recommendation_batches(id). Required.

[P01613 | 47009:47037 | NORMAL_TEXT | TABLE row=3 col=0]
source_supply_evaluation_id

[P01614 | 47038:47043 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01615 | 47044:47053 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01616 | 47054:47159 | NORMAL_TEXT | TABLE row=3 col=3]
Supply evaluation supporting the source branch’s surplus. FK to public.supply_evaluations(id). Required.

[P01617 | 47161:47194 | NORMAL_TEXT | TABLE row=4 col=0]
destination_supply_evaluation_id

[P01618 | 47195:47200 | NORMAL_TEXT | TABLE row=4 col=1]
UUID

[P01619 | 47201:47210 | NORMAL_TEXT | TABLE row=4 col=2]
16 bytes

[P01620 | 47211:47322 | NORMAL_TEXT | TABLE row=4 col=3]
Supply evaluation supporting the destination branch’s shortage. FK to public.supply_evaluations(id). Required.

[P01621 | 47324:47341 | NORMAL_TEXT | TABLE row=5 col=0]
source_branch_id

[P01622 | 47342:47347 | NORMAL_TEXT | TABLE row=5 col=1]
UUID

[P01623 | 47348:47357 | NORMAL_TEXT | TABLE row=5 col=2]
16 bytes

[P01624 | 47358:47443 | NORMAL_TEXT | TABLE row=5 col=3]
Branch proposed as the source of vehicle units. FK to public.branches(id). Required.

[P01625 | 47445:47467 | NORMAL_TEXT | TABLE row=6 col=0]
destination_branch_id

[P01626 | 47468:47473 | NORMAL_TEXT | TABLE row=6 col=1]
UUID

[P01627 | 47474:47483 | NORMAL_TEXT | TABLE row=6 col=2]
16 bytes

[P01628 | 47484:47582 | NORMAL_TEXT | TABLE row=6 col=3]
Different branch proposed as the recipient of vehicle units. FK to public.branches(id). Required.

[P01629 | 47584:47604 | NORMAL_TEXT | TABLE row=7 col=0]
vehicle_category_id

[P01630 | 47605:47610 | NORMAL_TEXT | TABLE row=7 col=1]
UUID

[P01631 | 47611:47620 | NORMAL_TEXT | TABLE row=7 col=2]
16 bytes

[P01632 | 47621:47715 | NORMAL_TEXT | TABLE row=7 col=3]
Vehicle category for which the record applies. FK to public.vehicle_categories(id). Required.

[P01633 | 47717:47734 | NORMAL_TEXT | TABLE row=8 col=0]
forecast_horizon

[P01634 | 47735:47744 | NORMAL_TEXT | TABLE row=8 col=1]
SMALLINT

[P01635 | 47745:47753 | NORMAL_TEXT | TABLE row=8 col=2]
2 bytes

[P01636 | 47754:47821 | NORMAL_TEXT | TABLE row=8 col=3]
Forecast horizon, expressed as one, two, or three weeks. Required.

[P01637 | 47823:47841 | NORMAL_TEXT | TABLE row=9 col=0]
target_week_start

[P01638 | 47842:47847 | NORMAL_TEXT | TABLE row=9 col=1]
DATE

[P01639 | 47848:47856 | NORMAL_TEXT | TABLE row=9 col=2]
4 bytes

[P01640 | 47857:47925 | NORMAL_TEXT | TABLE row=9 col=3]
Beginning date of the forecast or allocation target week. Required.

[P01641 | 47927:47943 | NORMAL_TEXT | TABLE row=10 col=0]
target_week_end

[P01642 | 47944:47949 | NORMAL_TEXT | TABLE row=10 col=1]
DATE

[P01643 | 47950:47958 | NORMAL_TEXT | TABLE row=10 col=2]
4 bytes

[P01644 | 47959:48028 | NORMAL_TEXT | TABLE row=10 col=3]
Ending boundary of the forecast or allocation target week. Required.

[P01645 | 48030:48061 | NORMAL_TEXT | TABLE row=11 col=0]
source_required_units_snapshot

[P01646 | 48062:48070 | NORMAL_TEXT | TABLE row=11 col=1]
INTEGER

[P01647 | 48071:48079 | NORMAL_TEXT | TABLE row=11 col=2]
4 bytes

[P01648 | 48080:48144 | NORMAL_TEXT | TABLE row=11 col=3]
Source branch’s required vehicle units at generation. Required.

[P01649 | 48146:48179 | NORMAL_TEXT | TABLE row=12 col=0]
source_projected_supply_snapshot

[P01650 | 48180:48188 | NORMAL_TEXT | TABLE row=12 col=1]
INTEGER

[P01651 | 48189:48197 | NORMAL_TEXT | TABLE row=12 col=2]
4 bytes

[P01652 | 48198:48265 | NORMAL_TEXT | TABLE row=12 col=3]
Source branch’s projected eligible supply at generation. Required.

[P01653 | 48267:48291 | NORMAL_TEXT | TABLE row=13 col=0]
source_surplus_snapshot

[P01654 | 48292:48300 | NORMAL_TEXT | TABLE row=13 col=1]
INTEGER

[P01655 | 48301:48309 | NORMAL_TEXT | TABLE row=13 col=2]
4 bytes

[P01656 | 48310:48369 | NORMAL_TEXT | TABLE row=13 col=3]
Positive source surplus preserved at generation. Required.

[P01657 | 48371:48407 | NORMAL_TEXT | TABLE row=14 col=0]
destination_required_units_snapshot

[P01658 | 48408:48416 | NORMAL_TEXT | TABLE row=14 col=1]
INTEGER

[P01659 | 48417:48425 | NORMAL_TEXT | TABLE row=14 col=2]
4 bytes

[P01660 | 48426:48495 | NORMAL_TEXT | TABLE row=14 col=3]
Destination branch’s required vehicle units at generation. Required.

[P01661 | 48497:48535 | NORMAL_TEXT | TABLE row=15 col=0]
destination_projected_supply_snapshot

[P01662 | 48536:48544 | NORMAL_TEXT | TABLE row=15 col=1]
INTEGER

[P01663 | 48545:48553 | NORMAL_TEXT | TABLE row=15 col=2]
4 bytes

[P01664 | 48554:48626 | NORMAL_TEXT | TABLE row=15 col=3]
Destination branch’s projected eligible supply at generation. Required.

[P01665 | 48628:48658 | NORMAL_TEXT | TABLE row=16 col=0]
destination_shortage_snapshot

[P01666 | 48659:48667 | NORMAL_TEXT | TABLE row=16 col=1]
INTEGER

[P01667 | 48668:48676 | NORMAL_TEXT | TABLE row=16 col=2]
4 bytes

[P01668 | 48677:48742 | NORMAL_TEXT | TABLE row=16 col=3]
Positive destination shortage preserved at generation. Required.

[P01669 | 48744:48771 | NORMAL_TEXT | TABLE row=17 col=0]
recommended_transfer_units

[P01670 | 48772:48780 | NORMAL_TEXT | TABLE row=17 col=1]
INTEGER

[P01671 | 48781:48789 | NORMAL_TEXT | TABLE row=17 col=2]
4 bytes

[P01672 | 48790:48897 | NORMAL_TEXT | TABLE row=17 col=3]
Suggested positive unit count, limited by the preserved source surplus and destination shortage. Required.

[P01673 | 48899:48914 | NORMAL_TEXT | TABLE row=18 col=0]
decision_state

[P01674 | 48915:48920 | NORMAL_TEXT | TABLE row=18 col=1]
TEXT

[P01675 | 48921:48923 | NORMAL_TEXT | TABLE row=18 col=2]
—

[P01676 | 48924:49027 | NORMAL_TEXT | TABLE row=18 col=3]
Owner/Admin review state of the recommendation. Allowed values: Pending, Approved, Rejected. Required.

[P01677 | 49029:49053 | NORMAL_TEXT | TABLE row=19 col=0]
approved_transfer_units

[P01678 | 49054:49062 | NORMAL_TEXT | TABLE row=19 col=1]
INTEGER

[P01679 | 49063:49071 | NORMAL_TEXT | TABLE row=19 col=2]
4 bytes

[P01680 | 49072:49192 | NORMAL_TEXT | TABLE row=19 col=3]
Approved positive unit count, no greater than the recommended count; recorded for an approved recommendation. Optional.

[P01681 | 49194:49205 | NORMAL_TEXT | TABLE row=20 col=0]
decided_by

[P01682 | 49206:49211 | NORMAL_TEXT | TABLE row=20 col=1]
UUID

[P01683 | 49212:49221 | NORMAL_TEXT | TABLE row=20 col=2]
16 bytes

[P01684 | 49222:49309 | NORMAL_TEXT | TABLE row=20 col=3]
User who approved or rejected the recommendation. FK to public.profiles(id). Optional.

[P01685 | 49311:49322 | NORMAL_TEXT | TABLE row=21 col=0]
decided_at

[P01686 | 49323:49335 | NORMAL_TEXT | TABLE row=21 col=1]
TIMESTAMPTZ

[P01687 | 49336:49344 | NORMAL_TEXT | TABLE row=21 col=2]
8 bytes

[P01688 | 49345:49408 | NORMAL_TEXT | TABLE row=21 col=3]
Date and time when the review decision was recorded. Optional.

[P01689 | 49410:49421 | NORMAL_TEXT | TABLE row=22 col=0]
created_at

[P01690 | 49422:49434 | NORMAL_TEXT | TABLE row=22 col=1]
TIMESTAMPTZ

[P01691 | 49435:49443 | NORMAL_TEXT | TABLE row=22 col=2]
8 bytes

[P01692 | 49444:49497 | NORMAL_TEXT | TABLE row=22 col=3]
Date and time when the record was created. Required.

[P01693 | 49498:49828 | NORMAL_TEXT]
Table 59 describes the table in the database named allocation_recommendations, where suggested units for movement between source and destination branches are stored with supply snapshots and Owner/Admin review decisions. Approval records a decision and does not automatically transfer vehicles or change their branch assignments.

[P01694 | 49828:49837 | NORMAL_TEXT]
Table 60

[P01695 | 49837:49892 | NORMAL_TEXT]
Data Dictionary – Allocation Recommendation Candidates

[P01696 | 49892:49893 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01697 | 49896:49907 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01698 | 49908:49918 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01699 | 49919:49930 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01700 | 49931:49943 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01701 | 49945:49948 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01702 | 49949:49954 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01703 | 49955:49964 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01704 | 49965:50022 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01705 | 50024:50042 | NORMAL_TEXT | TABLE row=2 col=0]
recommendation_id

[P01706 | 50043:50048 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01707 | 50049:50058 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01708 | 50059:50172 | NORMAL_TEXT | TABLE row=2 col=3]
Allocation recommendation to which the candidate belongs. FK to public.allocation_recommendations(id). Required.

[P01709 | 50174:50185 | NORMAL_TEXT | TABLE row=3 col=0]
vehicle_id

[P01710 | 50186:50191 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01711 | 50192:50201 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01712 | 50202:50275 | NORMAL_TEXT | TABLE row=3 col=3]
Vehicle associated with the record. FK to public.vehicles(id). Required.

[P01713 | 50277:50299 | NORMAL_TEXT | TABLE row=4 col=0]
vehicle_name_snapshot

[P01714 | 50300:50305 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01715 | 50306:50308 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01716 | 50309:50367 | NORMAL_TEXT | TABLE row=4 col=3]
Vehicle name preserved at candidate generation. Required.

[P01717 | 50369:50392 | NORMAL_TEXT | TABLE row=5 col=0]
license_plate_snapshot

[P01718 | 50393:50398 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01719 | 50399:50401 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01720 | 50402:50474 | NORMAL_TEXT | TABLE row=5 col=3]
Vehicle registration plate preserved at candidate generation. Optional.

[P01721 | 50476:50491 | NORMAL_TEXT | TABLE row=6 col=0]
candidate_rank

[P01722 | 50492:50500 | NORMAL_TEXT | TABLE row=6 col=1]
INTEGER

[P01723 | 50501:50509 | NORMAL_TEXT | TABLE row=6 col=2]
4 bytes

[P01724 | 50510:50583 | NORMAL_TEXT | TABLE row=6 col=3]
Positive candidate position, unique within the recommendation. Required.

[P01725 | 50585:50604 | NORMAL_TEXT | TABLE row=7 col=0]
idle_days_snapshot

[P01726 | 50605:50613 | NORMAL_TEXT | TABLE row=7 col=1]
INTEGER

[P01727 | 50614:50622 | NORMAL_TEXT | TABLE row=7 col=2]
4 bytes

[P01728 | 50623:50689 | NORMAL_TEXT | TABLE row=7 col=3]
Recorded nonnegative idle-day count, when determinable. Optional.

[P01729 | 50691:50715 | NORMAL_TEXT | TABLE row=8 col=0]
idle_reference_snapshot

[P01730 | 50716:50728 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P01731 | 50729:50737 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P01732 | 50738:50806 | NORMAL_TEXT | TABLE row=8 col=3]
Reference time used to interpret the recorded idle state. Optional.

[P01733 | 50808:50827 | NORMAL_TEXT | TABLE row=9 col=0]
revalidation_state

[P01734 | 50828:50833 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P01735 | 50834:50836 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P01736 | 50837:50972 | NORMAL_TEXT | TABLE row=9 col=3]
Eligibility classification recorded at generation, restricted to EligibleAtGeneration. Allowed values: EligibleAtGeneration. Required.

[P01737 | 50974:50992 | NORMAL_TEXT | TABLE row=10 col=0]
explanation_codes

[P01738 | 50993:50999 | NORMAL_TEXT | TABLE row=10 col=1]
JSONB

[P01739 | 51000:51002 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P01740 | 51003:51079 | NORMAL_TEXT | TABLE row=10 col=3]
Structured list of explanations accompanying candidate selection. Required.

[P01741 | 51081:51092 | NORMAL_TEXT | TABLE row=11 col=0]
created_at

[P01742 | 51093:51105 | NORMAL_TEXT | TABLE row=11 col=1]
TIMESTAMPTZ

[P01743 | 51106:51114 | NORMAL_TEXT | TABLE row=11 col=2]
8 bytes

[P01744 | 51115:51168 | NORMAL_TEXT | TABLE row=11 col=3]
Date and time when the record was created. Required.

[P01745 | 51169:51409 | NORMAL_TEXT]
Table 60 describes the table in the database named allocation_recommendation_candidates, where ranked vehicle candidates and the eligibility and idle-state information observed when an allocation recommendation was generated are preserved.

[P01746 | 51409:51418 | NORMAL_TEXT]
Table 61

[P01747 | 51418:51450 | NORMAL_TEXT]
Data Dictionary – Notifications

[P01748 | 51450:51451 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01749 | 51454:51465 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01750 | 51466:51476 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01751 | 51477:51488 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01752 | 51489:51501 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01753 | 51503:51506 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01754 | 51507:51512 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01755 | 51513:51522 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01756 | 51523:51580 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01757 | 51582:51595 | NORMAL_TEXT | TABLE row=2 col=0]
recipient_id

[P01758 | 51596:51601 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01759 | 51602:51611 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01760 | 51612:51702 | NORMAL_TEXT | TABLE row=2 col=3]
User to whom the notification or preference belongs. FK to public.profiles(id). Required.

[P01761 | 51704:51722 | NORMAL_TEXT | TABLE row=3 col=0]
notification_type

[P01762 | 51723:51728 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P01763 | 51729:51731 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P01764 | 51732:52125 | NORMAL_TEXT | TABLE row=3 col=3]
Canonical business-event or reminder category of the notification. Allowed values: requirements_needs_resubmission, requirements_verified, payment_needs_resubmission, payment_verified, booking_confirmed, new_booking_request, requirements_submitted, payment_proof_submitted, upcoming_pickup, upcoming_return, rental_overdue, maintenance_attention, low_availability, backup_attention. Required.

[P01765 | 52127:52133 | NORMAL_TEXT | TABLE row=4 col=0]
title

[P01766 | 52134:52139 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01767 | 52140:52142 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01768 | 52143:52201 | NORMAL_TEXT | TABLE row=4 col=3]
Title of the notification or operational alert. Required.

[P01769 | 52203:52211 | NORMAL_TEXT | TABLE row=5 col=0]
message

[P01770 | 52212:52217 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01771 | 52218:52220 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01772 | 52221:52252 | NORMAL_TEXT | TABLE row=5 col=3]
Text of the message. Required.

[P01773 | 52254:52274 | NORMAL_TEXT | TABLE row=6 col=0]
related_entity_type

[P01774 | 52275:52280 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P01775 | 52281:52283 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P01776 | 52284:52445 | NORMAL_TEXT | TABLE row=6 col=3]
Type of business record associated with the message or condition. Allowed values: booking, requirements, payment, rental, vehicle, branch, backup_run. Required.

[P01777 | 52447:52465 | NORMAL_TEXT | TABLE row=7 col=0]
related_entity_id

[P01778 | 52466:52471 | NORMAL_TEXT | TABLE row=7 col=1]
UUID

[P01779 | 52472:52481 | NORMAL_TEXT | TABLE row=7 col=2]
16 bytes

[P01780 | 52482:52600 | NORMAL_TEXT | TABLE row=7 col=3]
Identifier of the associated business record; interpreted using its type and not declared as a foreign key. Required.

[P01781 | 52602:52612 | NORMAL_TEXT | TABLE row=8 col=0]
event_key

[P01782 | 52613:52618 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P01783 | 52619:52621 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P01784 | 52622:52709 | NORMAL_TEXT | TABLE row=8 col=3]
Event identifier used with the recipient to prevent duplicate notifications. Required.

[P01785 | 52711:52722 | NORMAL_TEXT | TABLE row=9 col=0]
created_at

[P01786 | 52723:52735 | NORMAL_TEXT | TABLE row=9 col=1]
TIMESTAMPTZ

[P01787 | 52736:52744 | NORMAL_TEXT | TABLE row=9 col=2]
8 bytes

[P01788 | 52745:52798 | NORMAL_TEXT | TABLE row=9 col=3]
Date and time when the record was created. Required.

[P01789 | 52800:52808 | NORMAL_TEXT | TABLE row=10 col=0]
read_at

[P01790 | 52809:52821 | NORMAL_TEXT | TABLE row=10 col=1]
TIMESTAMPTZ

[P01791 | 52822:52830 | NORMAL_TEXT | TABLE row=10 col=2]
8 bytes

[P01792 | 52831:52892 | NORMAL_TEXT | TABLE row=10 col=3]
Date and time when the message was marked as read. Optional.

[P01793 | 52893:53184 | NORMAL_TEXT]
Table 61 describes the table in the database named notifications, where recipient-specific in-application messages, event identifiers, related-entity references, and read times are stored. Related-entity references identify different business-record types and are not declared foreign keys.

[P01794 | 53184:53193 | NORMAL_TEXT]
Table 62

[P01795 | 53193:53236 | NORMAL_TEXT]
Data Dictionary – Notification Preferences

[P01796 | 53236:53237 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01797 | 53240:53251 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01798 | 53252:53262 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01799 | 53263:53274 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01800 | 53275:53287 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01801 | 53289:53302 | NORMAL_TEXT | TABLE row=1 col=0]
recipient_id

[P01802 | 53303:53308 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01803 | 53309:53318 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01804 | 53319:53422 | NORMAL_TEXT | TABLE row=1 col=3]
User to whom the notification or preference belongs. Primary key. FK to public.profiles(id). Required.

[P01805 | 53424:53454 | NORMAL_TEXT | TABLE row=2 col=0]
maintenance_attention_enabled

[P01806 | 53455:53463 | NORMAL_TEXT | TABLE row=2 col=1]
BOOLEAN

[P01807 | 53464:53471 | NORMAL_TEXT | TABLE row=2 col=2]
1 byte

[P01808 | 53472:53549 | NORMAL_TEXT | TABLE row=2 col=3]
Indicates whether maintenance-attention notifications are enabled. Required.

[P01809 | 53551:53576 | NORMAL_TEXT | TABLE row=3 col=0]
low_availability_enabled

[P01810 | 53577:53585 | NORMAL_TEXT | TABLE row=3 col=1]
BOOLEAN

[P01811 | 53586:53593 | NORMAL_TEXT | TABLE row=3 col=2]
1 byte

[P01812 | 53594:53666 | NORMAL_TEXT | TABLE row=3 col=3]
Indicates whether low-availability notifications are enabled. Required.

[P01813 | 53668:53679 | NORMAL_TEXT | TABLE row=4 col=0]
updated_at

[P01814 | 53680:53692 | NORMAL_TEXT | TABLE row=4 col=1]
TIMESTAMPTZ

[P01815 | 53693:53701 | NORMAL_TEXT | TABLE row=4 col=2]
8 bytes

[P01816 | 53702:53757 | NORMAL_TEXT | TABLE row=4 col=3]
Date and time of the latest recorded update. Required.

[P01817 | 53759:53787 | NORMAL_TEXT | TABLE row=5 col=0]
email_notifications_enabled

[P01818 | 53788:53796 | NORMAL_TEXT | TABLE row=5 col=1]
BOOLEAN

[P01819 | 53797:53804 | NORMAL_TEXT | TABLE row=5 col=2]
1 byte

[P01820 | 53805:53866 | NORMAL_TEXT | TABLE row=5 col=3]
Indicates whether email notifications are enabled. Required.

[P01821 | 53867:54059 | NORMAL_TEXT]
Table 62 describes the table in the database named notification_preferences, where each user’s choices for maintenance alerts, low-availability alerts, and email notifications are maintained.

[P01822 | 54059:54068 | NORMAL_TEXT]
Table 63

[P01823 | 54068:54122 | NORMAL_TEXT]
Data Dictionary – Operational Notification Conditions

[P01824 | 54122:54123 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01825 | 54126:54137 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01826 | 54138:54148 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01827 | 54149:54160 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01828 | 54161:54173 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01829 | 54175:54190 | NORMAL_TEXT | TABLE row=1 col=0]
condition_type

[P01830 | 54191:54196 | NORMAL_TEXT | TABLE row=1 col=1]
TEXT

[P01831 | 54197:54199 | NORMAL_TEXT | TABLE row=1 col=2]
—

[P01832 | 54200:54375 | NORMAL_TEXT | TABLE row=1 col=3]
Operational condition being tracked. Part of the composite primary key (condition_type, related_entity_id). Allowed values: maintenance_attention, low_availability. Required.

[P01833 | 54377:54397 | NORMAL_TEXT | TABLE row=2 col=0]
related_entity_type

[P01834 | 54398:54403 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P01835 | 54404:54406 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P01836 | 54407:54516 | NORMAL_TEXT | TABLE row=2 col=3]
Type of business record associated with the message or condition. Allowed values: vehicle, branch. Required.

[P01837 | 54518:54536 | NORMAL_TEXT | TABLE row=3 col=0]
related_entity_id

[P01838 | 54537:54542 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01839 | 54543:54552 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01840 | 54553:54742 | NORMAL_TEXT | TABLE row=3 col=3]
Identifier of the associated business record; interpreted using its type and not declared as a foreign key. Part of the composite primary key (condition_type, related_entity_id). Required.

[P01841 | 54744:54754 | NORMAL_TEXT | TABLE row=4 col=0]
is_active

[P01842 | 54755:54763 | NORMAL_TEXT | TABLE row=4 col=1]
BOOLEAN

[P01843 | 54764:54771 | NORMAL_TEXT | TABLE row=4 col=2]
1 byte

[P01844 | 54772:54847 | NORMAL_TEXT | TABLE row=4 col=3]
Indicates whether the operational condition is currently active. Required.

[P01845 | 54849:54866 | NORMAL_TEXT | TABLE row=5 col=0]
occurrence_count

[P01846 | 54867:54874 | NORMAL_TEXT | TABLE row=5 col=1]
BIGINT

[P01847 | 54875:54883 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P01848 | 54884:54938 | NORMAL_TEXT | TABLE row=5 col=3]
Nonnegative count of condition occurrences. Required.

[P01849 | 54940:54946 | NORMAL_TEXT | TABLE row=6 col=0]
title

[P01850 | 54947:54952 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P01851 | 54953:54955 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P01852 | 54956:55014 | NORMAL_TEXT | TABLE row=6 col=3]
Title of the notification or operational alert. Required.

[P01853 | 55016:55024 | NORMAL_TEXT | TABLE row=7 col=0]
message

[P01854 | 55025:55030 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P01855 | 55031:55033 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P01856 | 55034:55065 | NORMAL_TEXT | TABLE row=7 col=3]
Text of the message. Required.

[P01857 | 55067:55080 | NORMAL_TEXT | TABLE row=8 col=0]
activated_at

[P01858 | 55081:55093 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P01859 | 55094:55102 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P01860 | 55103:55161 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time when the condition became active. Optional.

[P01861 | 55163:55175 | NORMAL_TEXT | TABLE row=9 col=0]
resolved_at

[P01862 | 55176:55188 | NORMAL_TEXT | TABLE row=9 col=1]
TIMESTAMPTZ

[P01863 | 55189:55197 | NORMAL_TEXT | TABLE row=9 col=2]
8 bytes

[P01864 | 55198:55255 | NORMAL_TEXT | TABLE row=9 col=3]
Date and time when the condition was resolved. Optional.

[P01865 | 55257:55275 | NORMAL_TEXT | TABLE row=10 col=0]
last_evaluated_at

[P01866 | 55276:55288 | NORMAL_TEXT | TABLE row=10 col=1]
TIMESTAMPTZ

[P01867 | 55289:55297 | NORMAL_TEXT | TABLE row=10 col=2]
8 bytes

[P01868 | 55298:55363 | NORMAL_TEXT | TABLE row=10 col=3]
Date and time of the most recent condition assessment. Required.

[P01869 | 55364:55685 | NORMAL_TEXT]
Table 63 describes the table in the database named operational_notification_conditions, where the activation and resolution of maintenance-attention and branch low-availability conditions are tracked to support controlled alert generation. The associated entity identifier is interpreted according to the condition type.

[P01870 | 55685:55694 | NORMAL_TEXT]
Table 64

[P01871 | 55694:55729 | NORMAL_TEXT]
Data Dictionary – Email Deliveries

[P01872 | 55729:55730 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01873 | 55733:55744 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01874 | 55745:55755 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01875 | 55756:55767 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01876 | 55768:55780 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01877 | 55782:55785 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01878 | 55786:55791 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01879 | 55792:55801 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01880 | 55802:55859 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01881 | 55861:55879 | NORMAL_TEXT | TABLE row=2 col=0]
recipient_user_id

[P01882 | 55880:55885 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P01883 | 55886:55895 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P01884 | 55896:55983 | NORMAL_TEXT | TABLE row=2 col=3]
User to whom the notification email is addressed. FK to public.profiles(id). Required.

[P01885 | 55985:56001 | NORMAL_TEXT | TABLE row=3 col=0]
notification_id

[P01886 | 56002:56007 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01887 | 56008:56017 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01888 | 56018:56161 | NORMAL_TEXT | TABLE row=3 col=3]
In-application notification associated with the email; unique per notification. FK to public.notifications(id). Unique when present. Required.

[P01889 | 56163:56176 | NORMAL_TEXT | TABLE row=4 col=0]
delivery_key

[P01890 | 56177:56182 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01891 | 56183:56185 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01892 | 56186:56272 | NORMAL_TEXT | TABLE row=4 col=3]
Unique identifier preventing duplicate email delivery. Unique when present. Required.

[P01893 | 56274:56285 | NORMAL_TEXT | TABLE row=5 col=0]
email_type

[P01894 | 56286:56291 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01895 | 56292:56294 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01896 | 56295:56567 | NORMAL_TEXT | TABLE row=5 col=3]
Canonical business-event or reminder category eligible for email delivery. Allowed values: requirements_needs_resubmission, requirements_verified, payment_needs_resubmission, payment_verified, booking_confirmed, upcoming_pickup, upcoming_return, rental_overdue. Required.

[P01897 | 56569:56576 | NORMAL_TEXT | TABLE row=6 col=0]
status

[P01898 | 56577:56582 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P01899 | 56583:56585 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P01900 | 56586:56686 | NORMAL_TEXT | TABLE row=6 col=3]
Recorded state of the record. Allowed values: Pending, Processing, Sent, Failed, Skipped. Required.

[P01901 | 56688:56702 | NORMAL_TEXT | TABLE row=7 col=0]
attempt_count

[P01902 | 56703:56711 | NORMAL_TEXT | TABLE row=7 col=1]
INTEGER

[P01903 | 56712:56720 | NORMAL_TEXT | TABLE row=7 col=2]
4 bytes

[P01904 | 56721:56776 | NORMAL_TEXT | TABLE row=7 col=3]
Number of delivery attempts, limited to 0–4. Required.

[P01905 | 56778:56798 | NORMAL_TEXT | TABLE row=8 col=0]
provider_message_id

[P01906 | 56799:56804 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P01907 | 56805:56807 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P01908 | 56808:56868 | NORMAL_TEXT | TABLE row=8 col=3]
Message reference returned by the email provider. Optional.

[P01909 | 56870:56886 | NORMAL_TEXT | TABLE row=9 col=0]
last_error_code

[P01910 | 56887:56892 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P01911 | 56893:56895 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P01912 | 56896:57138 | NORMAL_TEXT | TABLE row=9 col=3]
Classified result of the latest delivery error. Allowed values: ConfigurationError, RecipientUnavailable, RecipientInvalid, PreferenceDisabled, RateLimited, ProviderUnavailable, ProviderRejected, NetworkError, UnknownProviderError. Optional.

[P01913 | 57140:57156 | NORMAL_TEXT | TABLE row=10 col=0]
next_attempt_at

[P01914 | 57157:57169 | NORMAL_TEXT | TABLE row=10 col=1]
TIMESTAMPTZ

[P01915 | 57170:57178 | NORMAL_TEXT | TABLE row=10 col=2]
8 bytes

[P01916 | 57179:57243 | NORMAL_TEXT | TABLE row=10 col=3]
Scheduled date and time of the next delivery attempt. Optional.

[P01917 | 57245:57256 | NORMAL_TEXT | TABLE row=11 col=0]
created_at

[P01918 | 57257:57269 | NORMAL_TEXT | TABLE row=11 col=1]
TIMESTAMPTZ

[P01919 | 57270:57278 | NORMAL_TEXT | TABLE row=11 col=2]
8 bytes

[P01920 | 57279:57332 | NORMAL_TEXT | TABLE row=11 col=3]
Date and time when the record was created. Required.

[P01921 | 57334:57350 | NORMAL_TEXT | TABLE row=12 col=0]
last_attempt_at

[P01922 | 57351:57363 | NORMAL_TEXT | TABLE row=12 col=1]
TIMESTAMPTZ

[P01923 | 57364:57372 | NORMAL_TEXT | TABLE row=12 col=2]
8 bytes

[P01924 | 57373:57429 | NORMAL_TEXT | TABLE row=12 col=3]
Date and time of the latest delivery attempt. Optional.

[P01925 | 57431:57439 | NORMAL_TEXT | TABLE row=13 col=0]
sent_at

[P01926 | 57440:57452 | NORMAL_TEXT | TABLE row=13 col=1]
TIMESTAMPTZ

[P01927 | 57453:57461 | NORMAL_TEXT | TABLE row=13 col=2]
8 bytes

[P01928 | 57462:57524 | NORMAL_TEXT | TABLE row=13 col=3]
Date and time when successful sending was recorded. Optional.

[P01929 | 57525:57802 | NORMAL_TEXT]
Table 64 describes the table in the database named email_deliveries, where the delivery state, retry attempts, provider reference, and classified errors for an eligible notification email are tracked. Each notification can be associated with at most one email-delivery record.

[P01930 | 57802:57811 | NORMAL_TEXT]
Table 65

[P01931 | 57811:57842 | NORMAL_TEXT]
Data Dictionary – Audit Events

[P01932 | 57842:57843 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01933 | 57846:57857 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01934 | 57858:57868 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01935 | 57869:57880 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01936 | 57881:57893 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01937 | 57895:57898 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01938 | 57899:57904 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01939 | 57905:57914 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01940 | 57915:57972 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01941 | 57974:57985 | NORMAL_TEXT | TABLE row=2 col=0]
actor_type

[P01942 | 57986:57991 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P01943 | 57992:57994 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P01944 | 57995:58097 | NORMAL_TEXT | TABLE row=2 col=3]
Indicates whether the recorded actor is a User or the System. Allowed values: User, System. Required.

[P01945 | 58099:58113 | NORMAL_TEXT | TABLE row=3 col=0]
actor_user_id

[P01946 | 58114:58119 | NORMAL_TEXT | TABLE row=3 col=1]
UUID

[P01947 | 58120:58129 | NORMAL_TEXT | TABLE row=3 col=2]
16 bytes

[P01948 | 58130:58246 | NORMAL_TEXT | TABLE row=3 col=3]
Acting application user; present for User events and absent for System events. FK to public.profiles(id). Optional.

[P01949 | 58248:58255 | NORMAL_TEXT | TABLE row=4 col=0]
action

[P01950 | 58256:58261 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P01951 | 58262:58264 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P01952 | 58265:58876 | NORMAL_TEXT | TABLE row=4 col=3]
Canonical business-event action recorded in the audit trail. Allowed values: booking.created, booking.edited, booking.vehicle_assigned, booking.confirmed, booking.cancelled, booking.rejected, booking.withdrawn, booking.location_reconciled, requirements.submitted, requirements.resubmitted, requirements.needs_resubmission, requirements.verified, payment.quote_issued, payment.submitted, payment.resubmitted, payment.needs_resubmission, payment.verified, payment.requirement_set, rental.released, rental.returned, maintenance.created, maintenance.started, maintenance.completed, maintenance.cancelled. Required.

[P01953 | 58878:58890 | NORMAL_TEXT | TABLE row=5 col=0]
entity_type

[P01954 | 58891:58896 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P01955 | 58897:58899 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P01956 | 58900:59026 | NORMAL_TEXT | TABLE row=5 col=3]
Type of business record affected by the event. Allowed values: booking, requirements, payment, rental, maintenance. Required.

[P01957 | 59028:59038 | NORMAL_TEXT | TABLE row=6 col=0]
entity_id

[P01958 | 59039:59044 | NORMAL_TEXT | TABLE row=6 col=1]
UUID

[P01959 | 59045:59054 | NORMAL_TEXT | TABLE row=6 col=2]
16 bytes

[P01960 | 59055:59138 | NORMAL_TEXT | TABLE row=6 col=3]
Identifier interpreted using entity_type; not declared as a foreign key. Required.

[P01961 | 59140:59151 | NORMAL_TEXT | TABLE row=7 col=0]
booking_id

[P01962 | 59152:59157 | NORMAL_TEXT | TABLE row=7 col=1]
UUID

[P01963 | 59158:59167 | NORMAL_TEXT | TABLE row=7 col=2]
16 bytes

[P01964 | 59168:59249 | NORMAL_TEXT | TABLE row=7 col=3]
Booking associated with the record. FK to public.booking_requests(id). Optional.

[P01965 | 59251:59260 | NORMAL_TEXT | TABLE row=8 col=0]
metadata

[P01966 | 59261:59267 | NORMAL_TEXT | TABLE row=8 col=1]
JSONB

[P01967 | 59268:59270 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P01968 | 59271:59352 | NORMAL_TEXT | TABLE row=8 col=3]
Structured object containing contextual details of the recorded event. Required.

[P01969 | 59354:59366 | NORMAL_TEXT | TABLE row=9 col=0]
occurred_at

[P01970 | 59367:59379 | NORMAL_TEXT | TABLE row=9 col=1]
TIMESTAMPTZ

[P01971 | 59380:59388 | NORMAL_TEXT | TABLE row=9 col=2]
8 bytes

[P01972 | 59389:59438 | NORMAL_TEXT | TABLE row=9 col=3]
Date and time when the event occurred. Required.

[P01973 | 59439:59751 | NORMAL_TEXT]
Table 65 describes the table in the database named audit_events, where user-initiated or system-initiated business events are preserved with their action, entity reference, optional booking association, metadata, and occurrence time. This event-based record does not use a generic old-value and new-value model.

[P01974 | 59751:59760 | NORMAL_TEXT]
Table 66

[P01975 | 59760:59790 | NORMAL_TEXT]
Data Dictionary – Backup Runs

[P01976 | 59790:59791 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P01977 | 59794:59805 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P01978 | 59806:59816 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P01979 | 59817:59828 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P01980 | 59829:59841 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P01981 | 59843:59846 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P01982 | 59847:59852 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P01983 | 59853:59862 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P01984 | 59863:59920 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P01985 | 59922:59930 | NORMAL_TEXT | TABLE row=2 col=0]
trigger

[P01986 | 59931:59936 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P01987 | 59937:59939 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P01988 | 59940:60039 | NORMAL_TEXT | TABLE row=2 col=3]
Indicates whether the backup was Scheduled or Manual. Allowed values: Scheduled, Manual. Required.

[P01989 | 60041:60048 | NORMAL_TEXT | TABLE row=3 col=0]
status

[P01990 | 60049:60054 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P01991 | 60055:60057 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P01992 | 60058:60151 | NORMAL_TEXT | TABLE row=3 col=3]
Recorded state of the record. Allowed values: Running, Completed, Partial, Failed. Required.

[P01993 | 60153:60164 | NORMAL_TEXT | TABLE row=4 col=0]
started_at

[P01994 | 60165:60177 | NORMAL_TEXT | TABLE row=4 col=1]
TIMESTAMPTZ

[P01995 | 60178:60186 | NORMAL_TEXT | TABLE row=4 col=2]
8 bytes

[P01996 | 60187:60239 | NORMAL_TEXT | TABLE row=4 col=3]
Date and time when the operation started. Required.

[P01997 | 60241:60254 | NORMAL_TEXT | TABLE row=5 col=0]
completed_at

[P01998 | 60255:60267 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P01999 | 60268:60276 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P02000 | 60277:60331 | NORMAL_TEXT | TABLE row=5 col=3]
Date and time when the operation completed. Optional.

[P02001 | 60333:60349 | NORMAL_TEXT | TABLE row=6 col=0]
retention_until

[P02002 | 60350:60362 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P02003 | 60363:60371 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P02004 | 60372:60449 | NORMAL_TEXT | TABLE row=6 col=3]
Date and time through which the backup is scheduled for retention. Required.

[P02005 | 60451:60462 | NORMAL_TEXT | TABLE row=7 col=0]
error_code

[P02006 | 60463:60468 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P02007 | 60469:60471 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P02008 | 60472:60730 | NORMAL_TEXT | TABLE row=7 col=3]
Classified error associated with the operation. Allowed values: ConfigurationError, DatabaseDumpFailed, StorageEnumerationFailed, StorageObjectReadFailed, ArtifactUploadFailed, IntegrityValidationFailed, RetentionCleanupFailed, UnknownBackupError. Optional.

[P02009 | 60732:60740 | NORMAL_TEXT | TABLE row=8 col=0]
remarks

[P02010 | 60741:60746 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P02011 | 60747:60749 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P02012 | 60750:60807 | NORMAL_TEXT | TABLE row=8 col=3]
Additional remarks associated with the record. Optional.

[P02013 | 60809:60820 | NORMAL_TEXT | TABLE row=9 col=0]
created_by

[P02014 | 60821:60826 | NORMAL_TEXT | TABLE row=9 col=1]
UUID

[P02015 | 60827:60836 | NORMAL_TEXT | TABLE row=9 col=2]
16 bytes

[P02016 | 60837:60903 | NORMAL_TEXT | TABLE row=9 col=3]
User who created the record. FK to public.profiles(id). Optional.

[P02017 | 60905:60916 | NORMAL_TEXT | TABLE row=10 col=0]
created_at

[P02018 | 60917:60929 | NORMAL_TEXT | TABLE row=10 col=1]
TIMESTAMPTZ

[P02019 | 60930:60938 | NORMAL_TEXT | TABLE row=10 col=2]
8 bytes

[P02020 | 60939:60992 | NORMAL_TEXT | TABLE row=10 col=3]
Date and time when the record was created. Required.

[P02021 | 60993:61242 | NORMAL_TEXT]
Table 66 describes the table in the database named backup_runs, where scheduled or manual backup attempts, their completion states, retention dates, and classified errors are recorded. Completed, Partial, and Failed attempts remain distinguishable.

[P02022 | 61242:61251 | NORMAL_TEXT]
Table 67

[P02023 | 61251:61286 | NORMAL_TEXT]
Data Dictionary – Backup Artifacts

[P02024 | 61286:61287 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P02025 | 61290:61301 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P02026 | 61302:61312 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P02027 | 61313:61324 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P02028 | 61325:61337 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P02029 | 61339:61342 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P02030 | 61343:61348 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P02031 | 61349:61358 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P02032 | 61359:61416 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P02033 | 61418:61432 | NORMAL_TEXT | TABLE row=2 col=0]
backup_run_id

[P02034 | 61433:61438 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P02035 | 61439:61448 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P02036 | 61449:61552 | NORMAL_TEXT | TABLE row=2 col=3]
Backup attempt associated with the artifact or recovery drill. FK to public.backup_runs(id). Required.

[P02037 | 61554:61568 | NORMAL_TEXT | TABLE row=3 col=0]
artifact_type

[P02038 | 61569:61574 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P02039 | 61575:61577 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P02040 | 61578:61698 | NORMAL_TEXT | TABLE row=3 col=3]
Indicates whether the recovery asset protects Database or Storage content. Allowed values: Database, Storage. Required.

[P02041 | 61700:61713 | NORMAL_TEXT | TABLE row=4 col=0]
artifact_key

[P02042 | 61714:61719 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P02043 | 61720:61722 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P02044 | 61723:61817 | NORMAL_TEXT | TABLE row=4 col=3]
Logical recovery-asset reference without an access credential or signed access URL. Required.

[P02045 | 61819:61826 | NORMAL_TEXT | TABLE row=5 col=0]
status

[P02046 | 61827:61832 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P02047 | 61833:61835 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P02048 | 61836:61911 | NORMAL_TEXT | TABLE row=5 col=3]
Recorded state of the record. Allowed values: Completed, Failed. Required.

[P02049 | 61913:61924 | NORMAL_TEXT | TABLE row=6 col=0]
size_bytes

[P02050 | 61925:61932 | NORMAL_TEXT | TABLE row=6 col=1]
BIGINT

[P02051 | 61933:61941 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P02052 | 61942:61991 | NORMAL_TEXT | TABLE row=6 col=3]
Size of the file or artifact in bytes. Optional.

[P02053 | 61993:62000 | NORMAL_TEXT | TABLE row=7 col=0]
sha256

[P02054 | 62001:62006 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P02055 | 62007:62009 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P02056 | 62010:62098 | NORMAL_TEXT | TABLE row=7 col=3]
64-character hexadecimal SHA-256 integrity checksum for a completed artifact. Optional.

[P02057 | 62100:62111 | NORMAL_TEXT | TABLE row=8 col=0]
created_at

[P02058 | 62112:62124 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P02059 | 62125:62133 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P02060 | 62134:62187 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time when the record was created. Required.

[P02061 | 62188:62487 | NORMAL_TEXT]
Table 67 describes the table in the database named backup_artifacts, where database and file-storage recovery assets belonging to a backup attempt are identified, together with their completion state, byte size, and integrity checksum. Logical artifact references do not contain access credentials.

[P02062 | 62487:62496 | NORMAL_TEXT]
Table 68

[P02063 | 62496:62530 | NORMAL_TEXT]
Data Dictionary – Recovery Drills

[P02064 | 62530:62531 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P02065 | 62534:62545 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P02066 | 62546:62556 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P02067 | 62557:62568 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P02068 | 62569:62581 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P02069 | 62583:62586 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P02070 | 62587:62592 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P02071 | 62593:62602 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P02072 | 62603:62660 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P02073 | 62662:62676 | NORMAL_TEXT | TABLE row=2 col=0]
backup_run_id

[P02074 | 62677:62682 | NORMAL_TEXT | TABLE row=2 col=1]
UUID

[P02075 | 62683:62692 | NORMAL_TEXT | TABLE row=2 col=2]
16 bytes

[P02076 | 62693:62796 | NORMAL_TEXT | TABLE row=2 col=3]
Backup attempt associated with the artifact or recovery drill. FK to public.backup_runs(id). Required.

[P02077 | 62798:62817 | NORMAL_TEXT | TABLE row=3 col=0]
target_environment

[P02078 | 62818:62823 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P02079 | 62824:62826 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P02080 | 62827:62924 | NORMAL_TEXT | TABLE row=3 col=3]
Recovery-test environment, restricted to NonProduction. Allowed values: NonProduction. Required.

[P02081 | 62926:62933 | NORMAL_TEXT | TABLE row=4 col=0]
status

[P02082 | 62934:62939 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P02083 | 62940:62942 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P02084 | 62943:63024 | NORMAL_TEXT | TABLE row=4 col=3]
Recorded state of the record. Allowed values: Running, Passed, Failed. Required.

[P02085 | 63026:63037 | NORMAL_TEXT | TABLE row=5 col=0]
started_at

[P02086 | 63038:63050 | NORMAL_TEXT | TABLE row=5 col=1]
TIMESTAMPTZ

[P02087 | 63051:63059 | NORMAL_TEXT | TABLE row=5 col=2]
8 bytes

[P02088 | 63060:63112 | NORMAL_TEXT | TABLE row=5 col=3]
Date and time when the operation started. Required.

[P02089 | 63114:63127 | NORMAL_TEXT | TABLE row=6 col=0]
completed_at

[P02090 | 63128:63140 | NORMAL_TEXT | TABLE row=6 col=1]
TIMESTAMPTZ

[P02091 | 63141:63149 | NORMAL_TEXT | TABLE row=6 col=2]
8 bytes

[P02092 | 63150:63204 | NORMAL_TEXT | TABLE row=6 col=3]
Date and time when the operation completed. Optional.

[P02093 | 63206:63226 | NORMAL_TEXT | TABLE row=7 col=0]
database_validation

[P02094 | 63227:63232 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P02095 | 63233:63235 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P02096 | 63236:63337 | NORMAL_TEXT | TABLE row=7 col=3]
Recorded database-restoration validation outcome. Allowed values: Pending, Passed, Failed. Optional.

[P02097 | 63339:63358 | NORMAL_TEXT | TABLE row=8 col=0]
storage_validation

[P02098 | 63359:63364 | NORMAL_TEXT | TABLE row=8 col=1]
TEXT

[P02099 | 63365:63367 | NORMAL_TEXT | TABLE row=8 col=2]
—

[P02100 | 63368:63473 | NORMAL_TEXT | TABLE row=8 col=3]
Recorded file-storage restoration validation outcome. Allowed values: Pending, Passed, Failed. Optional.

[P02101 | 63475:63486 | NORMAL_TEXT | TABLE row=9 col=0]
error_code

[P02102 | 63487:63492 | NORMAL_TEXT | TABLE row=9 col=1]
TEXT

[P02103 | 63493:63495 | NORMAL_TEXT | TABLE row=9 col=2]
—

[P02104 | 63496:63670 | NORMAL_TEXT | TABLE row=9 col=3]
Classified error associated with the operation. Allowed values: ConfigurationError, IntegrityValidationFailed, RestoreFailed, ValidationFailed, UnknownBackupError. Optional.

[P02105 | 63672:63680 | NORMAL_TEXT | TABLE row=10 col=0]
remarks

[P02106 | 63681:63686 | NORMAL_TEXT | TABLE row=10 col=1]
TEXT

[P02107 | 63687:63689 | NORMAL_TEXT | TABLE row=10 col=2]
—

[P02108 | 63690:63747 | NORMAL_TEXT | TABLE row=10 col=3]
Additional remarks associated with the record. Optional.

[P02109 | 63749:63760 | NORMAL_TEXT | TABLE row=11 col=0]
created_at

[P02110 | 63761:63773 | NORMAL_TEXT | TABLE row=11 col=1]
TIMESTAMPTZ

[P02111 | 63774:63782 | NORMAL_TEXT | TABLE row=11 col=2]
8 bytes

[P02112 | 63783:63836 | NORMAL_TEXT | TABLE row=11 col=3]
Date and time when the record was created. Required.

[P02113 | 63837:64069 | NORMAL_TEXT]
Table 68 describes the table in the database named recovery_drills, where non-production recovery-validation attempts are recorded separately from backup creation. A passed drill requires successful database and storage validation.

[P02114 | 64069:64078 | NORMAL_TEXT]
Table 69

[P02115 | 64078:64120 | NORMAL_TEXT]
Data Dictionary – Public Contact Settings

[P02116 | 64120:64121 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P02117 | 64124:64135 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P02118 | 64136:64146 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P02119 | 64147:64158 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P02120 | 64159:64171 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P02121 | 64173:64176 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P02122 | 64177:64185 | NORMAL_TEXT | TABLE row=1 col=1]
BOOLEAN

[P02123 | 64186:64193 | NORMAL_TEXT | TABLE row=1 col=2]
1 byte

[P02124 | 64194:64267 | NORMAL_TEXT | TABLE row=1 col=3]
Single-row primary-key value, restricted to true. Primary key. Required.

[P02125 | 64269:64275 | NORMAL_TEXT | TABLE row=2 col=0]
phone

[P02126 | 64276:64281 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P02127 | 64282:64284 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P02128 | 64285:64331 | NORMAL_TEXT | TABLE row=2 col=3]
Published contact telephone number. Required.

[P02129 | 64333:64339 | NORMAL_TEXT | TABLE row=3 col=0]
email

[P02130 | 64340:64345 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P02131 | 64346:64348 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P02132 | 64349:64407 | NORMAL_TEXT | TABLE row=3 col=3]
Published email address of the rental business. Required.

[P02133 | 64409:64422 | NORMAL_TEXT | TABLE row=4 col=0]
office_hours

[P02134 | 64423:64428 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P02135 | 64429:64431 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P02136 | 64432:64479 | NORMAL_TEXT | TABLE row=4 col=3]
Published business or contact hours. Required.

[P02137 | 64481:64498 | NORMAL_TEXT | TABLE row=5 col=0]
location_summary

[P02138 | 64499:64504 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P02139 | 64505:64507 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P02140 | 64508:64568 | NORMAL_TEXT | TABLE row=5 col=3]
Readable summary of the public contact locations. Required.

[P02141 | 64570:64583 | NORMAL_TEXT | TABLE row=6 col=0]
service_area

[P02142 | 64584:64589 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P02143 | 64590:64592 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P02144 | 64593:64657 | NORMAL_TEXT | TABLE row=6 col=3]
Published description of the geographic service area. Required.

[P02145 | 64659:64676 | NORMAL_TEXT | TABLE row=7 col=0]
reply_commitment

[P02146 | 64677:64682 | NORMAL_TEXT | TABLE row=7 col=1]
TEXT

[P02147 | 64683:64685 | NORMAL_TEXT | TABLE row=7 col=2]
—

[P02148 | 64686:64749 | NORMAL_TEXT | TABLE row=7 col=3]
Published statement concerning replies to inquiries. Required.

[P02149 | 64751:64762 | NORMAL_TEXT | TABLE row=8 col=0]
updated_at

[P02150 | 64763:64775 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P02151 | 64776:64784 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P02152 | 64785:64840 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time of the latest recorded update. Required.

[P02153 | 64842:64853 | NORMAL_TEXT | TABLE row=9 col=0]
updated_by

[P02154 | 64854:64859 | NORMAL_TEXT | TABLE row=9 col=1]
UUID

[P02155 | 64860:64869 | NORMAL_TEXT | TABLE row=9 col=2]
16 bytes

[P02156 | 64870:64941 | NORMAL_TEXT | TABLE row=9 col=3]
User who last updated the record. FK to public.profiles(id). Optional.

[P02157 | 64942:65160 | NORMAL_TEXT]
Table 69 describes the table in the database named public_contact_settings, where the published contact details, office hours, service-area information, and reply commitment are maintained in a single settings record.

[P02158 | 65160:65169 | NORMAL_TEXT]
Table 70

[P02159 | 65169:65212 | NORMAL_TEXT]
Data Dictionary – Public Contact Locations

[P02160 | 65212:65213 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P02161 | 65216:65227 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P02162 | 65228:65238 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P02163 | 65239:65250 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P02164 | 65251:65263 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P02165 | 65265:65268 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P02166 | 65269:65274 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P02167 | 65275:65284 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P02168 | 65285:65342 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P02169 | 65344:65349 | NORMAL_TEXT | TABLE row=2 col=0]
name

[P02170 | 65350:65355 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P02171 | 65356:65358 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P02172 | 65359:65413 | NORMAL_TEXT | TABLE row=2 col=3]
Name of the public-facing contact location. Required.

[P02173 | 65415:65423 | NORMAL_TEXT | TABLE row=3 col=0]
address

[P02174 | 65424:65429 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P02175 | 65430:65432 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P02176 | 65433:65486 | NORMAL_TEXT | TABLE row=3 col=3]
Published address of the contact location. Required.

[P02177 | 65488:65493 | NORMAL_TEXT | TABLE row=4 col=0]
note

[P02178 | 65494:65499 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P02179 | 65500:65502 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P02180 | 65503:65564 | NORMAL_TEXT | TABLE row=4 col=3]
Optional explanatory note concerning the location. Optional.

[P02181 | 65566:65577 | NORMAL_TEXT | TABLE row=5 col=0]
sort_order

[P02182 | 65578:65587 | NORMAL_TEXT | TABLE row=5 col=1]
SMALLINT

[P02183 | 65588:65596 | NORMAL_TEXT | TABLE row=5 col=2]
2 bytes

[P02184 | 65597:65704 | NORMAL_TEXT | TABLE row=5 col=3]
Presentation position from 0 to 99; unique across public contact locations. Unique when present. Required.

[P02185 | 65706:65716 | NORMAL_TEXT | TABLE row=6 col=0]
is_active

[P02186 | 65717:65725 | NORMAL_TEXT | TABLE row=6 col=1]
BOOLEAN

[P02187 | 65726:65733 | NORMAL_TEXT | TABLE row=6 col=2]
1 byte

[P02188 | 65734:65784 | NORMAL_TEXT | TABLE row=6 col=3]
Indicates whether the record is active. Required.

[P02189 | 65786:65797 | NORMAL_TEXT | TABLE row=7 col=0]
created_at

[P02190 | 65798:65810 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P02191 | 65811:65819 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P02192 | 65820:65873 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when the record was created. Required.

[P02193 | 65875:65886 | NORMAL_TEXT | TABLE row=8 col=0]
updated_at

[P02194 | 65887:65899 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P02195 | 65900:65908 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P02196 | 65909:65964 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time of the latest recorded update. Required.

[P02197 | 65965:66249 | NORMAL_TEXT]
Table 70 describes the table in the database named public_contact_locations, where ordered public-facing contact locations are maintained separately from operational fleet branches. This distinction prevents public contact addresses from being treated as internal allocation records.

[P02198 | 66249:66258 | NORMAL_TEXT]
Table 71

[P02199 | 66258:66294 | NORMAL_TEXT]
Data Dictionary – Contact Inquiries

[P02200 | 66294:66295 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P02201 | 66298:66309 | NORMAL_TEXT | TABLE row=0 col=0]
Attributes

[P02202 | 66310:66320 | NORMAL_TEXT | TABLE row=0 col=1]
Data Type

[P02203 | 66321:66332 | NORMAL_TEXT | TABLE row=0 col=2]
Field Size

[P02204 | 66333:66345 | NORMAL_TEXT | TABLE row=0 col=3]
Description

[P02205 | 66347:66350 | NORMAL_TEXT | TABLE row=1 col=0]
id

[P02206 | 66351:66356 | NORMAL_TEXT | TABLE row=1 col=1]
UUID

[P02207 | 66357:66366 | NORMAL_TEXT | TABLE row=1 col=2]
16 bytes

[P02208 | 66367:66424 | NORMAL_TEXT | TABLE row=1 col=3]
Unique identifier for the record. Primary key. Required.

[P02209 | 66426:66431 | NORMAL_TEXT | TABLE row=2 col=0]
name

[P02210 | 66432:66437 | NORMAL_TEXT | TABLE row=2 col=1]
TEXT

[P02211 | 66438:66440 | NORMAL_TEXT | TABLE row=2 col=2]
—

[P02212 | 66441:66488 | NORMAL_TEXT | TABLE row=2 col=3]
Name supplied by the inquiry sender. Required.

[P02213 | 66490:66496 | NORMAL_TEXT | TABLE row=3 col=0]
email

[P02214 | 66497:66502 | NORMAL_TEXT | TABLE row=3 col=1]
TEXT

[P02215 | 66503:66505 | NORMAL_TEXT | TABLE row=3 col=2]
—

[P02216 | 66506:66568 | NORMAL_TEXT | TABLE row=3 col=3]
Reply email address supplied by the inquiry sender. Required.

[P02217 | 66570:66578 | NORMAL_TEXT | TABLE row=4 col=0]
subject

[P02218 | 66579:66584 | NORMAL_TEXT | TABLE row=4 col=1]
TEXT

[P02219 | 66585:66587 | NORMAL_TEXT | TABLE row=4 col=2]
—

[P02220 | 66588:66632 | NORMAL_TEXT | TABLE row=4 col=3]
Subject supplied for the inquiry. Required.

[P02221 | 66634:66642 | NORMAL_TEXT | TABLE row=5 col=0]
message

[P02222 | 66643:66648 | NORMAL_TEXT | TABLE row=5 col=1]
TEXT

[P02223 | 66649:66651 | NORMAL_TEXT | TABLE row=5 col=2]
—

[P02224 | 66652:66702 | NORMAL_TEXT | TABLE row=5 col=3]
Inquiry message supplied by the sender. Required.

[P02225 | 66704:66711 | NORMAL_TEXT | TABLE row=6 col=0]
status

[P02226 | 66712:66717 | NORMAL_TEXT | TABLE row=6 col=1]
TEXT

[P02227 | 66718:66720 | NORMAL_TEXT | TABLE row=6 col=2]
—

[P02228 | 66721:66796 | NORMAL_TEXT | TABLE row=6 col=3]
Recorded state of the record. Allowed values: New, Read, Closed. Required.

[P02229 | 66798:66809 | NORMAL_TEXT | TABLE row=7 col=0]
created_at

[P02230 | 66810:66822 | NORMAL_TEXT | TABLE row=7 col=1]
TIMESTAMPTZ

[P02231 | 66823:66831 | NORMAL_TEXT | TABLE row=7 col=2]
8 bytes

[P02232 | 66832:66885 | NORMAL_TEXT | TABLE row=7 col=3]
Date and time when the record was created. Required.

[P02233 | 66887:66895 | NORMAL_TEXT | TABLE row=8 col=0]
read_at

[P02234 | 66896:66908 | NORMAL_TEXT | TABLE row=8 col=1]
TIMESTAMPTZ

[P02235 | 66909:66917 | NORMAL_TEXT | TABLE row=8 col=2]
8 bytes

[P02236 | 66918:66979 | NORMAL_TEXT | TABLE row=8 col=3]
Date and time when the message was marked as read. Optional.

[P02237 | 66981:66989 | NORMAL_TEXT | TABLE row=9 col=0]
read_by

[P02238 | 66990:66995 | NORMAL_TEXT | TABLE row=9 col=1]
UUID

[P02239 | 66996:67005 | NORMAL_TEXT | TABLE row=9 col=2]
16 bytes

[P02240 | 67006:67080 | NORMAL_TEXT | TABLE row=9 col=3]
User who marked the inquiry as read. FK to public.profiles(id). Optional.

[P02241 | 67081:67269 | NORMAL_TEXT]
Table 71 describes the table in the database named contact_inquiries, where public inquiry messages, sender details, review status, and the user who marked a message as read are recorded.

[P02242 | 67269:67270 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

