<?php
// filepath: database/migrations/xxxx_xx_xx_create_course_prerequisite_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('course_prerequisite', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('prerequisite_id');
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('prerequisite_id')->references('id')->on('courses')->onDelete('cascade');
            $table->unique(['course_id', 'prerequisite_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('course_prerequisite');
    }
};