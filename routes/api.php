<?php

use App\Http\Controllers\API\DepartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Department Routes
    Route::apiResource('departments', DepartmentController::class);
});
