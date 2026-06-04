CREATE TYPE "UserThemePreference" AS ENUM ('LIGHT', 'DARK');

ALTER TABLE "User"
ADD COLUMN "themePreference" "UserThemePreference" NOT NULL DEFAULT 'LIGHT';
