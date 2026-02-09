@echo off
echo Deleting old repositories from karansethi121 account...
echo.

echo NOTE: This script uses GitHub CLI for authentication.
echo Make sure to run 'gh auth login' first.
echo.

echo Deleting classroom-checks...
gh repo delete karansethi121/classroom-checks --yes
echo.

echo Deleting finx...
gh repo delete karansethi121/finx --yes
echo.

echo Deleting finxwebsite...
gh repo delete karansethi121/finxwebsite --yes
echo.

echo Deleting karansethi121 (profile config)...
gh repo delete karansethi121/karansethi121 --yes
echo.

echo Deleting tasks...
gh repo delete karansethi121/tasks --yes
echo.

echo All old repositories deleted!
echo.
echo Keeping: one4health-website https://github.com/karansethi121/one4health-website