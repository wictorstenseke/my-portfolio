<!DOCTYPE html>
<html lang="sv">
    <head>
        <!-- import stuff for head -->
        <?php include "../includes/head.php" ?>
        <!-- no google indexing this page -->
        <meta name="robots" content="noindex">
        <!-- change if necessary to each site -->
        <title>404 | Sorry...</title>

    </head>
    <body>
        <?php $page = "404"; ?>

        <!-- import navbar -->

        <!-- import content -->
        <?php include "../includes/pages/error_404-include.php" ?>

        <!-- import footer -->


        <!-- imports jQuery first, then Bootstrap JS, then project-specific functions -->
        <script type="text/javascript" src="/js/startkit.min.js"></script>
    </body>
</html>
